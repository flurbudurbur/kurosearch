import type { FastifyPluginAsync } from 'fastify';
import { getVersionInfo } from './handlers.js';

/**
 * Version feature plugin
 * GET /api/version - Returns current application version
 */
export const versionFeature: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		'/version',
		{
			schema: {
				response: {
					200: {
						type: 'object',
						properties: {
							containerVersion: { type: 'string' }
						},
						required: ['containerVersion']
					}
				}
			}
		},
		getVersionInfo
	);
};
