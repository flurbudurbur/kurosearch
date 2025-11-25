/**
 * JSON Schemas for comments feature
 */

export const commentsQuerySchema = {
	type: 'object',
	properties: {
		post_id: {
			type: 'string',
			pattern: '^\\d+$',
			description: 'Post ID to fetch comments for'
		}
	},
	required: ['post_id']
} as const;

export const commentsResponseSchema = {
	200: {
		description: 'Comments XML data',
		type: 'string'
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
			error: { type: 'string' }
		}
	}
} as const;
