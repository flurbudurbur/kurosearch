import type { FastifyPluginAsync } from 'fastify';
import { getInstances } from './handlers.js';

/**
 * Instances feature plugin
 * GET /api/instances - Returns list of available instances
 */
export const instancesFeature: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		'/instances',
		{
			schema: {
				response: {
					200: {
						description: 'TOML file with instance definitions',
						type: 'string'
					},
					500: {
						type: 'object',
						properties: {
							error: { type: 'string' }
						}
					}
				}
			}
		},
		getInstances
	);
};
