import type { FastifyPluginAsync } from 'fastify';
import type Valkey from 'iovalkey';
import { getValkeyClient, isValkeyAvailable } from '../lib/valkey.js';

declare module 'fastify' {
	interface FastifyInstance {
		valkey: Valkey | null;
		isValkeyAvailable: () => Promise<boolean>;
	}
}

/**
 * Valkey plugin - decorates Fastify instance with Valkey client
 */
export const valkeyPlugin: FastifyPluginAsync = async (fastify) => {
	// Initialize Valkey client
	const client = getValkeyClient();

	// Decorate Fastify instance
	fastify.decorate('valkey', client);
	fastify.decorate('isValkeyAvailable', isValkeyAvailable);

	if (client) {
		fastify.log.info('Valkey client initialized successfully');
	} else {
		fastify.log.warn('Valkey client not available (disabled or connection failed)');
	}

	// Graceful shutdown
	fastify.addHook('onClose', async () => {
		if (client) {
			fastify.log.info('Closing Valkey connection...');
			await client.disconnect();
		}
	});
};
