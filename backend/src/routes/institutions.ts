import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, count } from 'drizzle-orm';
import { db, schema } from '@/db/client.js';
import { generateUuid } from '@/lib/id.js';
import { isInstitutionVerified } from '@/stellar/contracts.js';

const createBody = z.object({
  onchainId: z.string().length(64).regex(/^[0-9a-f]+$/),
  name: z.string().min(1).max(200),
  legalName: z.string().max(400).optional(),
  category: z.enum(['school', 'hospital', 'utility', 'grocery']).default('school'),
  stellarAddress: z.string().regex(/^G[A-Z0-9]{55}$/),
  bankAccountHash: z.string().length(64).regex(/^[0-9a-f]+$/),
  location: z.string().max(200).optional(),
  country: z.string().length(2).default('PK'),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
});

const listQuery = z.object({
  status: z.enum(['pending', 'verified', 'suspended', 'revoked']).optional(),
  category: z.enum(['school', 'hospital', 'utility', 'grocery']).optional(),
  country: z.string().length(2).optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const institutionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/institutions', async (req) => {
    const q = listQuery.parse(req.query);

    const conditions = [];
    if (q.status) conditions.push(eq(schema.institutions.kybStatus, q.status));
    if (q.category) conditions.push(eq(schema.institutions.category, q.category));
    if (q.country) conditions.push(eq(schema.institutions.country, q.country));

    const rows = await db
      .select()
      .from(schema.institutions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.institutions.createdAt))
      .limit(q.limit)
      .offset(q.offset);

    const [totalRow] = await db
      .select({ n: count() })
      .from(schema.institutions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return { institutions: rows, total: totalRow?.n ?? 0, limit: q.limit, offset: q.offset };
  });

  fastify.get('/institutions/verified', async (req) => {
    const q = z
      .object({
        category: z.enum(['school', 'hospital', 'utility', 'grocery']).default('school'),
        country: z.string().length(2).default('PK'),
      })
      .parse(req.query);

    const rows = await db
      .select({
        id: schema.institutions.id,
        onchainId: schema.institutions.onchainId,
        name: schema.institutions.name,
        stellarAddress: schema.institutions.stellarAddress,
        location: schema.institutions.location,
        country: schema.institutions.country,
      })
      .from(schema.institutions)
      .where(
        and(
          eq(schema.institutions.category, q.category),
          eq(schema.institutions.country, q.country),
          eq(schema.institutions.kybStatus, 'verified')
        )
      )
      .orderBy(schema.institutions.name);

    return { institutions: rows };
  });

  fastify.get('/institutions/:id', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [row] = await db
      .select()
      .from(schema.institutions)
      .where(eq(schema.institutions.id, id))
      .limit(1);
    if (!row) return reply.code(404).send({ error: 'Institution not found' });

    let onchainVerified: boolean | null = null;
    try {
      onchainVerified = await isInstitutionVerified(row.onchainId);
    } catch (err) {
      req.log.warn({ err, onchainId: row.onchainId }, 'is_verified check failed');
    }

    return { institution: row, onchainVerified };
  });

  fastify.post('/institutions', async (req, reply) => {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid payload',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const [existingOnchain] = await db
      .select({ id: schema.institutions.id })
      .from(schema.institutions)
      .where(eq(schema.institutions.onchainId, parsed.data.onchainId))
      .limit(1);
    if (existingOnchain) {
      return reply
        .code(409)
        .send({ error: 'Institution with this onchainId already exists' });
    }

    const [existingAddr] = await db
      .select({ id: schema.institutions.id })
      .from(schema.institutions)
      .where(eq(schema.institutions.stellarAddress, parsed.data.stellarAddress))
      .limit(1);
    if (existingAddr) {
      return reply
        .code(409)
        .send({ error: 'This Stellar address is already registered' });
    }

    const id = generateUuid();
    await db.insert(schema.institutions).values({
      id,
      onchainId: parsed.data.onchainId,
      name: parsed.data.name,
      legalName: parsed.data.legalName,
      category: parsed.data.category,
      stellarAddress: parsed.data.stellarAddress,
      bankAccountHash: parsed.data.bankAccountHash,
      location: parsed.data.location,
      country: parsed.data.country,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      registeredAt: new Date(),
      kybStatus: 'pending',
    });

    req.log.info({ id, name: parsed.data.name }, 'institution created');
    return reply.code(201).send({ ok: true, id });
  });
};
