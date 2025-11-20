import type { FastifyPluginAsync } from 'fastify';
import { randomInt } from 'crypto';
import { getValkeyClient, KUROSEARCH_SYNC_PREFIX } from '../lib/valkey.js';
import { compress, decompress } from '../lib/compression.js';
import { isDev, getEnvFromProcess } from '../config/env.js';
import { connectionManager } from '../websocket/manager.js';

// In test/dev environments, use shorter expiry (30 seconds) to prevent accumulation
// In production, use 5 minutes
const EXPIRY_TIME = isDev(getEnvFromProcess()) ? 30 : 5 * 60;

const generateOneTimeCode = (): string => {
	return String(randomInt(100000, 999999));
};

/**
 * Sync routes - create and consume one-time sync codes
 * POST /api/sync - Create sync code
 * GET /api/sync/:code - Consume sync code (one-time use)
 */
export const syncRoute: FastifyPluginAsync = async (fastify) => {
	// POST /api/sync - Create sync code
	fastify.post('/sync', async (request, reply) => {
		try {
			const valkeyClient = getValkeyClient();

			// If Valkey is not available, return 503
			if (!valkeyClient) {
				request.log.warn('Valkey client not available, cannot create sync code');
				return reply.code(503).send({ error: 'Sync service temporarily unavailable' });
			}

			// Read the configuration data
			const buffer = (await request.body) as Buffer;
			const configData = buffer.toString('utf-8');

			// Compress the data
			const compressed = compress(configData);

			// Generate a unique code
			const code = generateOneTimeCode();
			const key = `${KUROSEARCH_SYNC_PREFIX}${code}`;

			// Store in Valkey with TTL
			await valkeyClient.setex(key, EXPIRY_TIME, compressed);

			request.log.info(`Sync code created: ${code} (expires in ${EXPIRY_TIME}s)`);

			return reply.code(200).send({ code });
		} catch (err) {
			request.log.error({ err }, 'Error in sync POST handler');
			return reply.code(500).send({
				error: `Failed to generate sync code: ${err instanceof Error ? err.message : 'Unknown error'}`
			});
		}
	});

	// GET /api/sync/:code - Consume sync code
	fastify.get('/sync/:code', async (request, reply) => {
		const { code } = request.params as { code: string };

		if (!code) {
			return reply.code(400).send({ error: 'Code is required' });
		}

		try {
			const valkeyClient = getValkeyClient();

			// If Valkey is not available, return 503
			if (!valkeyClient) {
				request.log.warn('Valkey client not available, cannot retrieve sync code');
				return reply.code(503).send({ error: 'Sync service temporarily unavailable' });
			}

			const key = `${KUROSEARCH_SYNC_PREFIX}${code}`;

			// Get and delete atomically (one-time use)
			const compressedData = await valkeyClient.getdel(key);

			if (!compressedData) {
				return reply.code(404).send({ error: 'Code not found or expired' });
			}

			// Convert to Buffer if needed
			const buffer = Buffer.isBuffer(compressedData)
				? compressedData
				: Buffer.from(compressedData as string, 'utf-8');

			// Decompress the data
			const content = decompress(buffer);

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

			return reply.code(200).header('content-type', 'application/json').send(content);
		} catch (err) {
			request.log.error({ err }, 'Error retrieving sync code');
			return reply.code(500).send({ error: 'Failed to read config file' });
		}
	});
};
