import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomInt } from 'crypto';
import { getValkeyClient, KUROSEARCH_SYNC_PREFIX } from '../../lib/valkey.js';
import { compress, decompress } from '../../lib/compression.js';
import { isDev, getEnvFromProcess } from '../../config/env.js';
import { connectionManager } from '../../lib/websocket-manager.js';

// In test/dev environments, use shorter expiry (30 seconds) to prevent accumulation
// In production, use 5 minutes
const EXPIRY_TIME = isDev(getEnvFromProcess()) ? 30 : 5 * 60;

const generateOneTimeCode = (): string => {
	return String(randomInt(100000, 999999));
};

/**
 * HTTP handler for POST /sync - Create sync code
 */
export async function createSyncCode(request: FastifyRequest): Promise<{ code: string }> {
	const valkeyClient = getValkeyClient();

	// If Valkey is not available, throw 503
	if (!valkeyClient) {
		request.log.warn('Valkey client not available, cannot create sync code');
		const err = new Error('Sync service temporarily unavailable');
		(err as any).statusCode = 503;
		throw err;
	}

	// Read the configuration data
	const buffer = (await request.body) as Buffer;
	const configData = buffer.toString('utf-8');

	// Compress the data
	const compressed = compress(configData, request.log);

	// Generate a unique code
	const code = generateOneTimeCode();
	const key = `${KUROSEARCH_SYNC_PREFIX}${code}`;

	// Store in Valkey with TTL
	await valkeyClient.setex(key, EXPIRY_TIME, compressed);

	request.log.info(`Sync code created: ${code} (expires in ${EXPIRY_TIME}s)`);

	return { code };
}

/**
 * HTTP handler for GET /sync/:code - Consume sync code
 */
export async function consumeSyncCode(
	request: FastifyRequest<{ Params: { code: string } }>,
	reply: FastifyReply
): Promise<string> {
	const { code } = request.params;

	const valkeyClient = getValkeyClient();

	// If Valkey is not available, throw 503
	if (!valkeyClient) {
		request.log.warn('Valkey client not available, cannot retrieve sync code');
		const err = new Error('Sync service temporarily unavailable');
		(err as any).statusCode = 503;
		throw err;
	}

	const key = `${KUROSEARCH_SYNC_PREFIX}${code}`;

	// Get and delete atomically (one-time use)
	const compressedData = await valkeyClient.getdel(key);

	if (!compressedData) {
		const err = new Error('Code not found or expired');
		(err as any).statusCode = 404;
		throw err;
	}

	// Convert to Buffer if needed
	const buffer = Buffer.isBuffer(compressedData)
		? compressedData
		: Buffer.from(compressedData as string, 'utf-8');

	// Decompress the data
	const content = decompress(buffer, request.log);

	request.log.info(`Sync code consumed: ${code}`);

	// Notify WebSocket subscribers that the code was consumed
	const notified = connectionManager.notifySyncCode(code, {
		type: 'sync-notification',
		data: {
			code,
			consumed: true,
			timestamp: Date.now()
		}
	});

	if (notified > 0) {
		request.log.info(`Notified ${notified} WebSocket clients about sync code consumption`);
	}

	reply.header('content-type', 'application/json');
	return content;
}
