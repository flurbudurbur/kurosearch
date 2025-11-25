import type { FastifyPluginAsync } from 'fastify';
import { cacheInvalidateBodySchema, cacheInvalidateResponseSchema } from './schema.js';
import { invalidateCache } from './handlers.js';

/**
 * Cache feature plugin
 * POST /api/cache/invalidate - Manual cache invalidation
 */
export const cacheFeature: FastifyPluginAsync = async (fastify) => {
	fastify.post(
		'/cache/invalidate',
		{
			schema: {
				body: cacheInvalidateBodySchema,
				response: cacheInvalidateResponseSchema
			}
		},
		invalidateCache
	);
};
