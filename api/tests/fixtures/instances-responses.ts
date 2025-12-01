/**
 * Mock instances response for testing
 */
export const mockInstancesResponse = {
	version: '1.0.0',
	instances: [
		{
			name: 'kurosearch',
			url: 'https://kurosearch.com',
			country: 'United States',
			description: 'The official kurosearch website',
			source_url: 'https://github.com/kurozenzen/kurosearch',
			status: 0,
			details: {
				version: '1.2.0',
				last_check: 1756376211000,
				uptime: 100
			}
		},
		{
			name: 'flur34',
			url: 'https://flur34.com',
			country: 'Germany',
			description: 'European mirror',
			source_url: 'https://github.com/flurbudurbur/flur34',
			status: 1,
			details: {
				version: '2.0.0',
				last_check: 1756376211000,
				uptime: 99.5
			}
		}
	]
};

/**
 * Mock empty instances response
 */
export const mockInstancesResponseEmpty = {
	version: '1.0.0',
	instances: []
};

/**
 * Mock invalid instances response (missing instances array)
 */
export const mockInstancesResponseInvalid = {
	version: '1.0.0'
	// Missing instances array
};

/**
 * Mock instances response with partial data
 */
export const mockInstancesResponsePartial = {
	version: '1.0.0',
	instances: [
		{
			name: 'partial-instance'
			// Missing other fields
		}
	]
};
