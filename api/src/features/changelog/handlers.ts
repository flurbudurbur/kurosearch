import type { FastifyReply } from 'fastify';
import { getChangelog, type Changelog } from '../../lib/changelog-cache.js';

/**
 * HTTP handler for GET /changelog
 * Returns the cached changelog or 503 if unavailable
 */
export async function getChangelogInfo(
	_request: unknown,
	reply: FastifyReply
): Promise<Changelog | { error: string }> {
	const changelog = getChangelog();

	if (!changelog) {
		return reply.code(503).send({ error: 'Changelog unavailable' });
	}

	return changelog;
}
