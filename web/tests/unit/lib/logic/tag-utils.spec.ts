import { describe, it, expect } from 'vitest';
import {
	createModifiedTag,
	createTag,
	createSupertag,
	createSearchableTag
} from '$lib/logic/tag-utils';

// The functions in tag-utils are plain factories; we test that they return
// exactly the shapes and values we provide.

describe('tag-utils', () => {
	it('createModifiedTag returns a ModifiedTag with provided fields', () => {
		const tag = createModifiedTag('+', 'cute', 123, 'general');
		expect(tag).toEqual({ modifier: '+', name: 'cute', count: 123, type: 'general' });
	});

	it('createTag returns a Tag with provided fields', () => {
		const tag = createTag('artist_name', 42, 'artist');
		expect(tag).toEqual({ name: 'artist_name', count: 42, type: 'artist' });
	});

	it('createSupertag returns a Supertag with description and nested tags', () => {
		const tags: kurosearch.SearchableTag[] = [
			{ modifier: '+', name: 'blue_hair' },
			{ modifier: '-', name: 'gore' },
			{ modifier: '~', name: 'robot' }
		];
		const st = createSupertag('Cool Pack', 'A themed set of tags', tags);
		expect(st).toEqual({ name: 'Cool Pack', description: 'A themed set of tags', tags });
		// ensure array identity preserved
		expect(st.tags).toBe(tags);
	});

	it('createSearchableTag returns a SearchableTag with provided fields', () => {
		const st = createSearchableTag('-', 'nsfw');
		expect(st).toEqual({ modifier: '-', name: 'nsfw' });
	});
});
