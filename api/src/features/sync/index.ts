import type { FastifyPluginAsync } from 'fastify';
import {
	syncCodeParamsSchema,
	createSyncResponseSchema,
	consumeSyncResponseSchema
} from './schema.js';
import { createSyncCode, consumeSyncCode } from './handlers.js';

/**
 * Sync feature plugin
 * POST /api/sync - Create sync code
 * GET /api/sync/:code - Consume sync code (one-time use)
 */
export const syncFeature: FastifyPluginAsync = async (fastify) => {
	// POST /api/sync - Create sync code
	fastify.post(
		'/sync',
		{
			schema: {
				response: createSyncResponseSchema
			}
		},
		createSyncCode
	);

	// GET /api/sync/:code - Consume sync code
	fastify.get(
		'/sync/:code',
		{
			schema: {
				params: syncCodeParamsSchema,
				response: consumeSyncResponseSchema
			}
		},
		consumeSyncCode
	);
};
