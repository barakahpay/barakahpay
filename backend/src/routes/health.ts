import type { FastifyPluginAsync } from 'fastify';
import { healthCheck } from '@/stellar/client.js';
import { pingDb } from '@/db/client.js';
import { config } from '@/config.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => ({
    ok: true,
    service: 'barakahpay-backend',
    version: '0.1.0',
    env: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/health/deep', async () => {
    const dbOk = await pingDb();
    const stellar = await healthCheck();

    return {
      ok: dbOk && stellar.connected,
      timestamp: new Date().toISOString(),
      checks: {
        database: { ok: dbOk },
        stellar,
      },
      contracts: {
        escrow: config.ESCROW_CONTRACT_ID,
        registry: config.REGISTRY_CONTRACT_ID,
      },
    };
  });
};
