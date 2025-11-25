/**
 * JSON Schemas for tags feature
 */

export const tagsQuerySchema = {
	type: 'object',
	properties: {
		autocomplete: {
			type: 'string',
			description: 'Enable autocomplete mode'
		},
		q: {
			type: 'string',
			description: 'Search query for autocomplete'
		},
		name: {
			type: 'string',
			description: 'Tag name for details lookup'
		}
	}
} as const;

export const tagsResponseSchema = {
	200: {
		description: 'Tags data (JSON for autocomplete, XML for details)',
		type: 'string'
	},
	500: {
		type: 'object',
		properties: {
			error: { type: 'string' }
		}
	}
} as const;
