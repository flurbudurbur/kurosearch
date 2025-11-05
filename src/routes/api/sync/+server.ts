import type { RequestHandler } from '@sveltejs/kit';
import { randomInt } from 'crypto';
import { error } from '@sveltejs/kit';
import { getValkeyClient, KUROSEARCH_SYNC_PREFIX } from '$lib/server/valkey.js';
import { compress } from '$lib/server/compression.js';

// In test environments, use shorter expiry (30 seconds) to prevent accumulation
// In production, use 5 minutes
const EXPIRY_TIME = process.env.NODE_ENV === 'test' ? 30 : 5 * 60;

const generateOneTimeCode = () => {
	return String(randomInt(100000, 999999));
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const valkeyClient = getValkeyClient();

		// If Valkey is not available, return 503
		if (!valkeyClient) {
			console.warn('Valkey client not available, cannot create sync code');
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
		await valkeyClient.setEx(key, EXPIRY_TIME, compressed);

		console.log(`Sync code created: ${code} (expires in ${EXPIRY_TIME}s)`);

		return new Response(JSON.stringify({ code }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Error in sync POST handler:', err);

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

// Test helper functions for backward compatibility
export const _getTempFile = (code: string) => {
	// This function is used by tests - return a mock structure
	// In the Valkey implementation, we don't track files in memory
	return undefined;
};

export const _consumeTempFile = async (code: string): Promise<string | undefined> => {
	const valkeyClient = getValkeyClient();

	if (!valkeyClient) {
		return undefined;
	}

	const key = `${KUROSEARCH_SYNC_PREFIX}${code}`;

	try {
		// Get and delete atomically (simulating one-time use)
		const compressedData = await valkeyClient.getDel(key);

		if (!compressedData) {
			return undefined;
		}

		// If the data is a string, convert it to Buffer
		const buffer = Buffer.isBuffer(compressedData)
			? compressedData
			: Buffer.from(compressedData as string, 'utf-8');

		// Decompress the data
		const { decompress } = await import('$lib/server/compression.js');
		const content = decompress(buffer);

		return content;
	} catch (err) {
		console.error('Error consuming temp file:', err);
		throw err;
	}
};
