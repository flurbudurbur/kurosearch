import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

describe('saved-posts-store', () => {
	beforeEach(async () => {
		// Clear localStorage
		localStorage.clear();
		// Reset modules to get fresh store instances
		vi.resetModules();
	});

	it('starts with empty posts array', async () => {
		const savedPostsStore = await import('$lib/store/saved-posts-store');
		const state = get(savedPostsStore.default);
		expect(state.posts).toEqual([]);
	});

	it('adds a post to the store', async () => {
		const savedPostsStore = await import('$lib/store/saved-posts-store');
		const mockPost: kurosearch.SavedPost = {
			id: 123,
			sample_url: 'https://example.com/sample.jpg',
			preview_url: 'https://example.com/preview.jpg',
			file_url: 'https://example.com/file.jpg',
			tags: 'tag1 tag2',
			width: 800,
			height: 600,
			rating: 'safe',
			score: 10
		};

		savedPostsStore.default.add(mockPost);
		const state = get(savedPostsStore.default);
		expect(state.posts).toHaveLength(1);
		expect(state.posts[0]).toEqual(mockPost);
	});

	it('does not add duplicate posts', async () => {
		const savedPostsStore = await import('$lib/store/saved-posts-store');
		const mockPost: kurosearch.SavedPost = {
			id: 123,
			sample_url: 'https://example.com/sample.jpg',
			preview_url: 'https://example.com/preview.jpg',
			file_url: 'https://example.com/file.jpg',
			tags: 'tag1 tag2',
			width: 800,
			height: 600,
			rating: 'safe',
			score: 10
		};

		savedPostsStore.default.add(mockPost);
		savedPostsStore.default.add(mockPost);
		const state = get(savedPostsStore.default);
		expect(state.posts).toHaveLength(1);
	});

	it('removes a post from the store', async () => {
		const savedPostsStore = await import('$lib/store/saved-posts-store');
		const mockPost: kurosearch.SavedPost = {
			id: 123,
			sample_url: 'https://example.com/sample.jpg',
			preview_url: 'https://example.com/preview.jpg',
			file_url: 'https://example.com/file.jpg',
			tags: 'tag1 tag2',
			width: 800,
			height: 600,
			rating: 'safe',
			score: 10
		};

		savedPostsStore.default.add(mockPost);
		expect(get(savedPostsStore.default).posts).toHaveLength(1);

		savedPostsStore.default.remove(mockPost);
		expect(get(savedPostsStore.default).posts).toHaveLength(0);
	});

	it('resets the store to initial state', async () => {
		const savedPostsStore = await import('$lib/store/saved-posts-store');
		const mockPost: kurosearch.SavedPost = {
			id: 123,
			sample_url: 'https://example.com/sample.jpg',
			preview_url: 'https://example.com/preview.jpg',
			file_url: 'https://example.com/file.jpg',
			tags: 'tag1 tag2',
			width: 800,
			height: 600,
			rating: 'safe',
			score: 10
		};

		savedPostsStore.default.add(mockPost);
		expect(get(savedPostsStore.default).posts).toHaveLength(1);

		savedPostsStore.default.reset();
		expect(get(savedPostsStore.default).posts).toHaveLength(0);
	});
});
