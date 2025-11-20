import type { FastifyPluginAsync } from 'fastify';
import { invalidateCachePattern } from '../lib/cache-utils.js';

/**
 * Cache management route - admin endpoint for manual cache invalidation
 * POST /api/cache/invalidate
 * Body: { pattern: string }
 */
export const cacheRoute: FastifyPluginAsync = async (fastify) => {
	fastify.post('/cache/invalidate', async (request, reply) => {
		const body = request.body as { pattern?: string };

		// Validate pattern parameter
		if (!body || typeof body.pattern !== 'string' || !body.pattern.trim()) {
			return reply.code(400).send({
				error: 'Missing required field: pattern (string)'
			});
		}

		const pattern = body.pattern.trim();

		// Validate pattern format - must start with kurosearch: prefix
		if (!pattern.startsWith('kurosearch:')) {
			return reply.code(400).send({
				error: 'Invalid pattern: must start with "kurosearch:" prefix'
			});
		}

		// Additional safety: prevent dangerous patterns
		const dangerousPatterns = ['*', 'kurosearch:*'];
		if (dangerousPatterns.includes(pattern)) {
			return reply.code(400).send({
				error: 'Invalid pattern: cannot use wildcard-only patterns for safety'
			});
		}

		try {
			// Invalidate cache with WebSocket broadcast
			const invalidatedCount = await invalidateCachePattern(pattern, true, request.log);

			request.log.info({ pattern, invalidatedCount }, 'Manual cache invalidation completed');

			return reply.code(200).send({
				success: true,
				pattern,
				invalidatedCount,
				message: `Successfully invalidated ${invalidatedCount} cache keys matching pattern: ${pattern}`
			});
		} catch (error) {
			request.log.error({ error, pattern }, 'Error invalidating cache');
			return reply.code(500).send({
				error: 'Failed to invalidate cache',
				pattern
			});
		}
	});
};
