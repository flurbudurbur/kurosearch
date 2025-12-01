import type { FastifyPluginAsync } from 'fastify';
import { getInstancesHandler } from './handlers.js';

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
						type: 'object',
						properties: {
							version: { type: 'string' },
							instances: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										name: { type: 'string' },
										url: { type: 'string' },
										country: { type: 'string' },
										description: { type: 'string' },
										source_url: { type: 'string' },
										status: { type: 'number' },
										details: {
											type: 'object',
											properties: {
												version: { type: 'string' },
												last_check: { type: 'number' },
												uptime: { type: 'number' }
											}
										}
									}
								}
							}
						},
						required: ['version', 'instances']
					},
					503: {
						type: 'object',
						properties: {
							error: { type: 'string' }
						},
						required: ['error']
					}
				}
			}
		},
		getInstancesHandler
	);
};
