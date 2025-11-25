/**
 * JSON Schemas for cache feature
 */

export const cacheInvalidateBodySchema = {
	type: 'object',
	properties: {
		pattern: {
			type: 'string',
			minLength: 12,
			pattern: '^kurosearch:.+',
			description: 'Cache key pattern to invalidate (must start with kurosearch:)'
		}
	},
	required: ['pattern']
} as const;

export const cacheInvalidateResponseSchema = {
	200: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			pattern: { type: 'string' },
			invalidatedCount: { type: 'number' },
			message: { type: 'string' }
		}
	},
	400: {
		type: 'object',
		properties: {
			error: { type: 'string' }
		}
	},
	500: {
		type: 'object',
		properties: {
			error: { type: 'string' },
			pattern: { type: 'string' }
		}
	}
} as const;
