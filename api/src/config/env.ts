import type { FastifyEnvOptions } from '@fastify/env';
import type Ajv from 'ajv';
import envSchemaLib from 'env-schema';
import addFormats from 'ajv-formats';

/**
 * Environment variable configuration interface
 */
export interface EnvConfig {
	// Server
	BACKEND_PORT: number;
	BACKEND_HOST: string;
	NODE_ENV: 'development' | 'production' | 'test';

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

	// Instances
	INSTANCES_URL?: string;
	INSTANCES_TTL?: number;
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
			default: 3001,
			minimum: 1,
			maximum: 65535
		},
		BACKEND_HOST: {
			type: 'string',
			default: '0.0.0.0'
		},
		NODE_ENV: {
			type: 'string',
			default: 'development',
			enum: ['development', 'production', 'test']
		},

		// Rule34 API (required)
		RULE34_API_KEY: {
			type: 'string',
			minLength: 1
		},
		RULE34_API_USER: {
			type: 'string',
			minLength: 1
		},

		// Security
		FRONTEND_ORIGIN: {
			type: 'string',
			format: 'uri'
		},
		SYNC_ENCRYPTION_SECRET: {
			type: 'string',
			minLength: 32
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
			default: 6379,
			minimum: 1,
			maximum: 65535
		},
		VALKEY_PASSWORD: {
			type: 'string'
		},
		VALKEY_DB: {
			type: 'number',
			default: 0,
			minimum: 0,
			maximum: 15
		},

		// WebSocket
		WS_HEARTBEAT_INTERVAL: {
			type: 'number',
			default: 30000,
			minimum: 1000,
			maximum: 300000
		},
		WS_MAX_CONNECTIONS: {
			type: 'number',
			default: 10000,
			minimum: 1,
			maximum: 100000
		},

		// Optional
		KUROSEARCH_CANONICAL_URL: {
			type: 'string',
			format: 'uri'
		},
		GITHUB_REPO: {
			type: 'string',
			default: 'owner/repo'
		},

		// Instances
		INSTANCES_URL: {
			type: 'string',
			default: ''
		},
		INSTANCES_TTL: {
			type: 'number',
			default: 300000, // 5 minutes
			minimum: 60000, // 1 minute minimum
			maximum: 3600000 // 1 hour maximum
		}
	}
} as const;

/**
 * Get the path to the .env file in the monorepo root
 */
function getDotenvPath(): string {
	return new URL('../../../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
}

/**
 * @fastify/env plugin options
 * Loads .env from the monorepo root directory
 */
export const envOptions: FastifyEnvOptions = {
	confKey: 'config',
	schema: envSchema,
	dotenv: {
		path: getDotenvPath()
	},
	data: process.env,
	ajv: {
		customOptions(ajvInstance: Ajv) {
			addFormats(ajvInstance);
			return ajvInstance;
		}
	}
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

// Singleton for validated environment config
let validatedEnv: EnvConfig | null = null;

/**
 * Get environment config from process.env for non-Fastify contexts.
 * Uses env-schema to validate against the same schema as @fastify/env.
 * Results are cached for performance.
 */
export function getEnvFromProcess(): EnvConfig {
	if (validatedEnv) {
		return validatedEnv;
	}

	try {
		validatedEnv = envSchemaLib({
			schema: envSchema,
			dotenv: {
				path: getDotenvPath()
			},
			ajv: {
				customOptions(ajvInstance: Ajv) {
					addFormats(ajvInstance);
					return ajvInstance;
				}
			}
		}) as EnvConfig;

		return validatedEnv;
	} catch (error) {
		console.error('\n❌ Environment validation failed:\n');
		if (error instanceof Error) {
			console.error(error.message);
		}
		console.error('\nCheck your .env file or environment variables.\n');
		process.exit(1);
	}
}
