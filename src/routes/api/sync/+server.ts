import type { RequestHandler } from '@sveltejs/kit';
import { randomInt } from 'crypto';
import { error } from '@sveltejs/kit';
import { getValkeyClient, KUROSEARCH_SYNC_PREFIX } from '$lib/server/valkey.js';
import { compress } from '$lib/server/compression.js';
import { logger } from '$lib/server/logger.js';

// Cache NODE_ENV check at module level (server startup)
const IS_TEST_ENV = process.env.NODE_ENV === 'test';

// In test environments, use shorter expiry (30 seconds) to prevent accumulation
// In production, use 5 minutes
const EXPIRY_TIME = IS_TEST_ENV ? 30 : 5 * 60;

const generateOneTimeCode = () => {
	return String(randomInt(100000, 999999));
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const valkeyClient = getValkeyClient();

		// If Valkey is not available, return 503
		if (!valkeyClient) {
			logger.warn('Valkey client not available, cannot create sync code');
			throw error(503, 'Sync service temporarily unavailable');
		}

		// Read the configuration data
		const file = await request.arrayBuffer();
		const buffer = Buffer.from(file);
		const configData = buffer.toString('utf-8');

		// Compress the data
		const compressed = compress(configData);

		// Generate a unique code
		const code = generateOneTimeCode();
		const key = `${KUROSEARCH_SYNC_PREFIX}${code}`;

		// Store in Valkey with TTL
		await valkeyClient.setex(key, EXPIRY_TIME, compressed);

		logger.info({ code, expiryTime: EXPIRY_TIME }, 'Sync code created');

		return new Response(JSON.stringify({ code }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		logger.error({ err }, 'Error in sync POST handler');

		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(
			500,
			`Failed to generate sync code: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};
