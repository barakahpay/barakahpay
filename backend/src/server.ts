import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config, isDev } from './config.js';
import { routes } from './routes/index.js';

async function build() {
  const app = Fastify({
    logger: isDev
      ? {
          level: config.LOG_LEVEL,
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss.l' },
          },
        }
      : { level: config.LOG_LEVEL },
    trustProxy: true,
    bodyLimit: 100_000,
  });

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  });

  await app.register(routes, { prefix: '/api' });

  app.get('/', async () => ({
    service: 'barakahpay-backend',
    version: '0.1.0',
    docs: '/api/health/deep',
  }));

  app.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    req.log.error({ err }, 'unhandled error');
    reply.code(err.statusCode ?? 500).send({
      error: isDev ? err.message : 'Internal server error',
      ...(isDev && err.stack ? { stack: err.stack } : {}),
    });
  });

  return app;
}

async function main() {
  const app = await build();
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(
      `BarakahPay backend listening on http://${config.HOST}:${config.PORT}`
    );
    app.log.info(
      { escrow: config.ESCROW_CONTRACT_ID, registry: config.REGISTRY_CONTRACT_ID },
      'Connected to Stellar testnet contracts'
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, async () => {
      app.log.info(`${sig} received — shutting down gracefully`);
      await app.close();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
