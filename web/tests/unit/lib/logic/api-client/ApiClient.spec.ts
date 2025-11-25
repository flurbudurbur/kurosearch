import { describe, it, expect } from 'vitest';
import * as Api from '$lib/logic/api-client';

describe('ApiClient barrel exports', () => {
	it('exports client instances and constants', () => {
		// Client instances
		expect(Api.postsClient).toBeDefined();
		expect(Api.commentsClient).toBeDefined();
		expect(Api.tagsClient).toBeDefined();

		// Client methods
		expect(typeof Api.postsClient.getPage).toBe('function');
		expect(typeof Api.postsClient.getPost).toBe('function');
		expect(typeof Api.postsClient.getCount).toBe('function');

		expect(typeof Api.commentsClient.getComments).toBe('function');

		expect(typeof Api.tagsClient.getTagSuggestions).toBe('function');
		expect(typeof Api.tagsClient.getTagDetails).toBe('function');

		// Constants
		expect(typeof Api.PAGE_SIZE).toBe('number');

		// Utility functions
		expect(typeof Api.resetAllClients).toBe('function');
	});
});
