/**
 * JSON Schemas for sync feature
 */

export const syncCodeParamsSchema = {
	type: 'object',
	properties: {
		code: {
			type: 'string',
			pattern: '^\\d{6}$',
			description: '6-digit sync code'
		}
	},
	required: ['code']
} as const;

export const createSyncResponseSchema = {
	200: {
		type: 'object',
		properties: {
			code: { type: 'string', pattern: '^\\d{6}$' }
		},
		required: ['code']
	},
	500: {
		type: 'object',
		properties: {
			error: { type: 'string' }
		}
	},
	503: {
		type: 'object',
		properties: {
			error: { type: 'string' }
		}
	}
} as const;

export const consumeSyncResponseSchema = {
	200: {
		description: 'Sync configuration data',
		type: 'string'
	},
	404: {
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
	},
	503: {
		type: 'object',
		properties: {
			error: { type: 'string' }
		}
	}
} as const;
