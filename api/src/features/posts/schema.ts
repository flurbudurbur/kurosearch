/**
 * JSON Schemas for posts feature
 */

export const postsQuerySchema = {
	type: 'object',
	properties: {
		tags: { type: 'string', description: 'Tags to search for (space or + separated)' },
		limit: { type: 'string', pattern: '^\\d+$', description: 'Number of posts to return' },
		pid: { type: 'string', pattern: '^\\d+$', description: 'Page ID for pagination' },
		id: { type: 'string', pattern: '^\\d+$', description: 'Specific post ID' },
		fields: { type: 'string', description: 'Fields to include in response' }
	},
	additionalProperties: true
} as const;

export const postsResponseSchema = {
	200: {
		description: 'Posts data (JSON or XML depending on request)',
		type: 'string'
	},
	500: {
		type: 'object',
		properties: {
			error: { type: 'string' }
		}
	}
} as const;
