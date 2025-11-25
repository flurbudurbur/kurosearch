import type { FastifyPluginAsync } from 'fastify';
import { postsQuerySchema, postsResponseSchema } from './schema.js';
import { getPosts } from './handlers.js';

/**
 * Posts feature plugin
 * GET /api/posts - Fetch posts from Rule34 API with caching
 */
export const postsFeature: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		'/posts',
		{
			schema: {
				querystring: postsQuerySchema,
				response: postsResponseSchema
			}
		},
		getPosts
	);
};
