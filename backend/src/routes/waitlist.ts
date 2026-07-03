import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, desc, count, sql } from 'drizzle-orm';
import { db, schema } from '@/db/client.js';
import { generateUuid } from '@/lib/id.js';

const submitBody = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(['sender', 'school', 'other']),
  country: z.string().min(1).max(100),
  locale: z.enum(['en', 'ur']).optional(),
  source: z.string().max(50).optional(),
});

export const waitlistRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/waitlist', async (req, reply) => {
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid payload',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await db
      .select({ id: schema.waitlist.id })
      .from(schema.waitlist)
      .where(eq(schema.waitlist.email, email))
      .limit(1);

    if (existing.length > 0) {
      return reply.send({ ok: true, duplicate: true });
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() ?? req.ip;

    await db.insert(schema.waitlist).values({
      id: generateUuid(),
      name: parsed.data.name.trim(),
      email,
      role: parsed.data.role,
      country: parsed.data.country.trim(),
      locale: parsed.data.locale,
      source: parsed.data.source ?? 'landing',
      ip,
    });

    const [countRow] = await db
      .select({ total: count() })
      .from(schema.waitlist);

    req.log.info(
      { role: parsed.data.role, country: parsed.data.country },
      'waitlist signup'
    );

    return reply.send({ ok: true, total: countRow?.total ?? 0 });
  });

  fastify.get('/waitlist/stats', async () => {
    const [totalRow] = await db.select({ total: count() }).from(schema.waitlist);

    const byRole = await db
      .select({
        role: schema.waitlist.role,
        n: count(),
      })
      .from(schema.waitlist)
      .groupBy(schema.waitlist.role);

    const byCountry = await db
      .select({
        country: schema.waitlist.country,
        n: count(),
      })
      .from(schema.waitlist)
      .groupBy(schema.waitlist.country)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    return {
      total: totalRow?.total ?? 0,
      byRole: Object.fromEntries(byRole.map((r) => [r.role, r.n])),
      topCountries: byCountry,
    };
  });

  // Admin-only listing (auth added in next iteration)
  fastify.get('/waitlist/entries', async (req) => {
    const query = z
      .object({
        limit: z.coerce.number().min(1).max(500).default(50),
        offset: z.coerce.number().min(0).default(0),
      })
      .parse(req.query);

    const entries = await db
      .select()
      .from(schema.waitlist)
      .orderBy(desc(schema.waitlist.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return { entries, limit: query.limit, offset: query.offset };
  });
};
