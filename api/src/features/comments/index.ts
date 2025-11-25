import type { FastifyPluginAsync } from 'fastify';
import { commentsQuerySchema, commentsResponseSchema } from './schema.js';
import { getComments } from './handlers.js';

/**
 * Comments feature plugin
 * GET /api/comments - Fetch comments for a post with caching
 */
export const commentsFeature: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		'/comments',
		{
			schema: {
				querystring: commentsQuerySchema,
				response: commentsResponseSchema
			}
		},
		getComments
	);
};
