import { describe, it, expect } from 'vitest';
import { TAG_TYPES, TAG_TYPES_WITH_ICONS, getTagTypePriority } from '$lib/logic/tag-type-data';

describe('tag-type-data', () => {
	it('TAG_TYPES contains expected ordered types', () => {
		expect(TAG_TYPES[0]).toBe('artist');
		expect(TAG_TYPES.includes('general')).toBe(true);
		expect(TAG_TYPES.includes('supertag')).toBe(true);
	});

	it('getTagTypePriority returns index for known types and 99 for unknown', () => {
		expect(getTagTypePriority('artist')).toBe(0);
		expect(getTagTypePriority('general')).toBe(TAG_TYPES.indexOf('general'));
		expect(getTagTypePriority('supertag')).toBe(TAG_TYPES.indexOf('supertag'));
		expect(getTagTypePriority('nonexistent' as any)).toBe(99);
	});

	it('TAG_TYPES_WITH_ICONS contains icons for known types', () => {
		expect(TAG_TYPES_WITH_ICONS.artist).toBe('user-edit');
		expect(TAG_TYPES_WITH_ICONS.supertag).toBe('star-filled');
	});
});
