import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { db, schema } from '@/db/client.js';
import { generateUuid, generate32ByteHex } from '@/lib/id.js';
import { isInstitutionVerified, getEscrow } from '@/stellar/contracts.js';

const draftBody = z.object({
  senderId: z.string(),
  senderAddress: z.string().regex(/^G[A-Z0-9]{55}$/),
  institutionId: z.string(),
  amount: z
    .string()
    .regex(/^\d+$/, 'Amount must be a decimal string in smallest units'),
  reference: z.string().min(1).max(64),
  purpose: z
    .enum(['school_fees', 'medical', 'utility', 'grocery'])
    .default('school_fees'),
  timeoutSeconds: z.number().int().min(3600).max(60 * 60 * 24 * 90),
  tokenAddress: z.string().regex(/^C[A-Z0-9]{55}$/),
});

const listQuery = z.object({
  senderId: z.string().optional(),
  institutionId: z.string().optional(),
  status: z
    .enum(['draft', 'pending_deposit', 'active', 'released', 'refunded', 'disputed'])
    .optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const transactionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/transactions', async (req) => {
    const q = listQuery.parse(req.query);
    const conditions = [];
    if (q.senderId) conditions.push(eq(schema.transactions.senderId, q.senderId));
    if (q.institutionId)
      conditions.push(eq(schema.transactions.institutionId, q.institutionId));
    if (q.status) conditions.push(eq(schema.transactions.status, q.status));

    const rows = await db
      .select()
      .from(schema.transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.transactions.createdAt))
      .limit(q.limit)
      .offset(q.offset);

    return { transactions: rows, limit: q.limit, offset: q.offset };
  });

  fastify.get('/transactions/:id', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [row] = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))
      .limit(1);
    if (!row) return reply.code(404).send({ error: 'Transaction not found' });

    let onchainState: unknown = null;
    try {
      onchainState = await getEscrow(row.onchainEscrowId);
    } catch (err) {
      req.log.warn(
        { err, onchainEscrowId: row.onchainEscrowId },
        'escrow read failed'
      );
    }

    return { transaction: row, onchainState };
  });

  /**
   * Draft a new transaction. Creates the DB record and returns the
   * onchainEscrowId that the client should use when calling the escrow
   * contract's create_escrow function from their wallet.
   *
   * The client then confirms the on-chain tx via POST /transactions/:id/confirm.
   */
  fastify.post('/transactions/draft', async (req, reply) => {
    const parsed = draftBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid payload',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const [institution] = await db
      .select()
      .from(schema.institutions)
      .where(eq(schema.institutions.id, parsed.data.institutionId))
      .limit(1);
    if (!institution) {
      return reply.code(404).send({ error: 'Institution not found' });
    }
    if (institution.kybStatus !== 'verified') {
      return reply
        .code(409)
        .send({ error: 'Institution is not currently verified' });
    }

    let onchainVerified = false;
    try {
      onchainVerified = await isInstitutionVerified(institution.onchainId);
    } catch (err) {
      req.log.warn({ err }, 'onchain verification check failed');
    }
    if (!onchainVerified) {
      return reply
        .code(409)
        .send({ error: 'Institution not verified on-chain' });
    }

    const id = generateUuid();
    const onchainEscrowId = generate32ByteHex();
    const timeoutAt = new Date(Date.now() + parsed.data.timeoutSeconds * 1000);

    await db.insert(schema.transactions).values({
      id,
      onchainEscrowId,
      senderId: parsed.data.senderId,
      senderAddress: parsed.data.senderAddress,
      institutionId: institution.id,
      institutionAddress: institution.stellarAddress,
      tokenAddress: parsed.data.tokenAddress,
      amount: parsed.data.amount,
      purpose: parsed.data.purpose,
      reference: parsed.data.reference,
      status: 'draft',
      timeoutSeconds: parsed.data.timeoutSeconds,
      timeoutAt,
    });

    return reply.code(201).send({
      ok: true,
      id,
      onchainEscrowId,
      institutionAddress: institution.stellarAddress,
      timeoutAt: timeoutAt.toISOString(),
    });
  });

  /**
   * Client submits the on-chain create_escrow tx hash after signing with wallet.
   * Backend stores it and moves transaction to 'active'.
   */
  fastify.post('/transactions/:id/confirm', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { txHash } = z
      .object({ txHash: z.string().length(64).regex(/^[0-9a-f]+$/) })
      .parse(req.body);

    const [row] = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))
      .limit(1);
    if (!row) return reply.code(404).send({ error: 'Transaction not found' });
    if (row.status !== 'draft') {
      return reply
        .code(409)
        .send({ error: `Cannot confirm from status ${row.status}` });
    }

    await db
      .update(schema.transactions)
      .set({
        createEscrowTxHash: txHash,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(schema.transactions.id, id));

    return { ok: true };
  });
};
