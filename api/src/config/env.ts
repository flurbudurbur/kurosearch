import type { FastifyEnvOptions } from '@fastify/env';

/**
 * Environment variable configuration interface
 */
export interface EnvConfig {
	// Server
	BACKEND_PORT: number;
	BACKEND_HOST: string;
	NODE_ENV: string;

	// Rule34 API
	RULE34_API_KEY: string;
	RULE34_API_USER: string;

	// Security
	FRONTEND_ORIGIN: string;
	SYNC_ENCRYPTION_SECRET?: string;

	// Valkey
	VALKEY_ENABLED: boolean;
	VALKEY_HOST: string;
	VALKEY_PORT: number;
	VALKEY_PASSWORD?: string;
	VALKEY_DB: number;

	// WebSocket
	WS_HEARTBEAT_INTERVAL: number;
	WS_MAX_CONNECTIONS: number;

	// Optional
	KUROSEARCH_CANONICAL_URL?: string;
	GITHUB_REPO?: string;
}

/**
 * JSON Schema for environment variables
 * Used by @fastify/env for validation and type coercion
 */
export const envSchema = {
	type: 'object',
	required: ['RULE34_API_KEY', 'RULE34_API_USER', 'FRONTEND_ORIGIN'],
	properties: {
		// Server
		BACKEND_PORT: {
			type: 'number',
			default: 3001
		},
		BACKEND_HOST: {
			type: 'string',
			default: '0.0.0.0'
		},
		NODE_ENV: {
			type: 'string',
			default: 'development'
		},

		// Rule34 API (required)
		RULE34_API_KEY: {
			type: 'string'
		},
		RULE34_API_USER: {
			type: 'string'
		},

		// Security
		FRONTEND_ORIGIN: {
			type: 'string'
		},
		SYNC_ENCRYPTION_SECRET: {
			type: 'string'
		},

		// Valkey
		VALKEY_ENABLED: {
			type: 'boolean',
			default: true
		},
		VALKEY_HOST: {
			type: 'string',
			default: 'localhost'
		},
		VALKEY_PORT: {
			type: 'number',
			default: 6379
		},
		VALKEY_PASSWORD: {
			type: 'string'
		},
		VALKEY_DB: {
			type: 'number',
			default: 0
		},

		// WebSocket
		WS_HEARTBEAT_INTERVAL: {
			type: 'number',
			default: 30000
		},
		WS_MAX_CONNECTIONS: {
			type: 'number',
			default: 10000
		},

		// Optional
		KUROSEARCH_CANONICAL_URL: {
			type: 'string'
		},
		GITHUB_REPO: {
			type: 'string',
			default: 'owner/repo'
		}
	}
} as const;

/**
 * @fastify/env plugin options
 * Loads .env from the monorepo root directory
 */
export const envOptions: FastifyEnvOptions = {
	confKey: 'config',
	schema: envSchema,
	dotenv: {
		path: new URL('../../../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
	},
	data: process.env
};

/**
 * Helper to check if running in production
 */
export function isProd(env: EnvConfig): boolean {
	return env.NODE_ENV === 'production';
}

/**
 * Helper to check if running in development
 */
export function isDev(env: EnvConfig): boolean {
	return env.NODE_ENV === 'development';
}

/**
 * Get environment config from process.env for non-Fastify contexts
 * This is a simplified version that doesn't validate, since validation
 * is done by @fastify/env when the server starts
 */
export function getEnvFromProcess(): EnvConfig {
	return {
		// Server
		BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '3001', 10),
		BACKEND_HOST: process.env.BACKEND_HOST || '0.0.0.0',
		NODE_ENV: process.env.NODE_ENV || 'development',

		// Rule34 API
		RULE34_API_KEY: process.env.RULE34_API_KEY!,
		RULE34_API_USER: process.env.RULE34_API_USER!,

		// Security
		FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN!,
		SYNC_ENCRYPTION_SECRET: process.env.SYNC_ENCRYPTION_SECRET,

		// Valkey
		VALKEY_ENABLED: process.env.VALKEY_ENABLED !== 'false',
		VALKEY_HOST: process.env.VALKEY_HOST || 'localhost',
		VALKEY_PORT: parseInt(process.env.VALKEY_PORT || '6379', 10),
		VALKEY_PASSWORD: process.env.VALKEY_PASSWORD || undefined,
		VALKEY_DB: parseInt(process.env.VALKEY_DB || '0', 10),

		// WebSocket
		WS_HEARTBEAT_INTERVAL: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
		WS_MAX_CONNECTIONS: parseInt(process.env.WS_MAX_CONNECTIONS || '10000', 10),

		// Optional
		KUROSEARCH_CANONICAL_URL: process.env.KUROSEARCH_CANONICAL_URL,
		GITHUB_REPO: process.env.GITHUB_REPO || 'owner/repo'
	};
}
