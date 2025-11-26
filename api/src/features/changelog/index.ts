import type { FastifyPluginAsync } from 'fastify';
import { getChangelogInfo } from './handlers.js';

/**
 * Changelog feature plugin
 * GET /api/changelog - Returns latest release changelog
 */
export const changelogFeature: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		'/changelog',
		{
			schema: {
				response: {
					200: {
						type: 'object',
						properties: {
							version: { type: 'string' },
							name: { type: 'string' },
							body: { type: 'string' },
							publishedAt: { type: 'string' },
							url: { type: 'string' }
						},
						required: ['version', 'name', 'body', 'publishedAt', 'url']
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
		getChangelogInfo
	);
};
