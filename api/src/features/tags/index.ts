import type { FastifyPluginAsync } from 'fastify';
import { tagsQuerySchema, tagsResponseSchema } from './schema.js';
import { getTags } from './handlers.js';

/**
 * Tags feature plugin
 * GET /api/tags - Fetch tags (autocomplete or details)
 */
export const tagsFeature: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		'/tags',
		{
			schema: {
				querystring: tagsQuerySchema,
				response: tagsResponseSchema
			}
		},
		getTags
	);
};
