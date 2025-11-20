import Valkey from 'iovalkey';
import { getEnvFromProcess } from '../config/env.js';

export const KUROSEARCH_SYNC_PREFIX = 'kurosearch:sync:';

type ValkeyClient = Valkey;

let client: ValkeyClient | null = null;
let connectionAttempted = false;

/**
 * Get the Valkey client instance. Returns null if Valkey is disabled or connection fails.
 */
export function getValkeyClient(): ValkeyClient | null {
	const env = getEnvFromProcess();

	// If feature is disabled, return null
	if (!env.VALKEY_ENABLED) {
		return null;
	}

	// Return existing client if available
	if (client) {
		return client;
	}

	// Only attempt connection once to avoid repeated failures
	if (connectionAttempted) {
		return null;
	}

	connectionAttempted = true;

	try {
		const { VALKEY_PORT, VALKEY_DB, VALKEY_HOST, VALKEY_PASSWORD } = env;

		client = new Valkey({
			host: VALKEY_HOST,
			port: VALKEY_PORT,
			password: VALKEY_PASSWORD || undefined,
			db: VALKEY_DB,
			// iovalkey automatically connects, no need to call connect()
			lazyConnect: false
		});

		// Handle connection errors
		client.on('error', (err: unknown) => {
			console.error('Valkey connection error:', err);
			client = null;
		});

		// Handle successful connection
		client.on('connect', () => {
			console.log(`Valkey client connected successfully to ${VALKEY_HOST}:${VALKEY_PORT}`);
		});

		return client;
	} catch (err) {
		console.error('Error creating Valkey client:', err);
		client = null;
		return null;
	}
}

/**
 * Check if Valkey is available and connected
 */
export async function isValkeyAvailable(): Promise<boolean> {
	const valkeyClient = getValkeyClient();
	if (!valkeyClient) {
		return false;
	}

	try {
		await valkeyClient.ping();
		return true;
	} catch (err) {
		console.error('Valkey ping failed:', err);
		return false;
	}
}

/**
 * Close the Valkey connection. Primarily used for testing.
 */
export async function closeValkeyConnection(): Promise<void> {
	if (client) {
		try {
			await client.disconnect();
			console.log('Valkey connection closed');
		} catch (err) {
			console.error('Error closing Valkey connection:', err);
		} finally {
			client = null;
			connectionAttempted = false;
		}
	}
}
