import type { FastifyPluginAsync } from 'fastify';
import { healthRoutes } from './health.js';
import { waitlistRoutes } from './waitlist.js';
import { institutionRoutes } from './institutions.js';
import { transactionRoutes } from './transactions.js';

export const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);
  await fastify.register(waitlistRoutes);
  await fastify.register(institutionRoutes);
  await fastify.register(transactionRoutes);
};
