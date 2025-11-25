import type { FastifyRequest } from 'fastify';
import { invalidateCachePattern } from '../../lib/cache-utils.js';

interface CacheInvalidateResponse {
	success: boolean;
	pattern: string;
	invalidatedCount: number;
	message: string;
}

/**
 * HTTP handler for POST /cache/invalidate
 */
export async function invalidateCache(
	request: FastifyRequest<{ Body: { pattern: string } }>
): Promise<CacheInvalidateResponse> {
	const { pattern } = request.body;

	// Additional safety: prevent dangerous patterns
	const dangerousPatterns = ['*', 'kurosearch:*'];
	if (dangerousPatterns.includes(pattern)) {
		const err = new Error('Invalid pattern: cannot use wildcard-only patterns for safety');
		(err as any).statusCode = 400;
		throw err;
	}

	// Invalidate cache with WebSocket broadcast
	const invalidatedCount = await invalidateCachePattern(pattern, true, request.log);

	request.log.info({ pattern, invalidatedCount }, 'Manual cache invalidation completed');

	return {
		success: true,
		pattern,
		invalidatedCount,
		message: `Successfully invalidated ${invalidatedCount} cache keys matching pattern: ${pattern}`
	};
}
