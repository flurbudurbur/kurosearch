import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { getValkeyClient, KUROSEARCH_SYNC_PREFIX } from '$lib/server/valkey.js';
import { decompress } from '$lib/server/compression.js';
import { logger } from '$lib/server/logger.js';

export const GET: RequestHandler = async ({ params }) => {
	const code = params.code;

	if (!code) {
		throw error(400, 'Code is required');
	}

	try {
		const valkeyClient = getValkeyClient();

		// If Valkey is not available, return 503
		if (!valkeyClient) {
			logger.warn('Valkey client not available, cannot retrieve sync code');
			throw error(503, 'Sync service temporarily unavailable');
		}

		const key = `${KUROSEARCH_SYNC_PREFIX}${code}`;

		// Get and delete atomically (one-time use)
		const compressedData = await valkeyClient.getdel(key);

		if (!compressedData) {
			throw error(404, 'Code not found or expired');
		}

		// Convert to Buffer if needed
		const buffer = Buffer.isBuffer(compressedData)
			? compressedData
			: Buffer.from(compressedData as string, 'utf-8');

		// Decompress the data
		const content = decompress(buffer);

		logger.info({ code }, 'Sync code consumed');

		return new Response(content, {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		logger.error({ err }, 'Error retrieving sync code');
		throw error(500, 'Failed to read config file');
	}
};
