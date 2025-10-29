export const TAG_TYPES = Object.freeze([
	'artist',
	'character',
	'copyright',
	'source',
	'metadata',
	'rating',
	'tag',
	'general',
	'ambiguous',
	'supertag'
] as kurosearch.TagType[]);

export const TAG_TYPES_WITH_ICONS: Partial<Record<kurosearch.TagType, string>> = Object.freeze({
	artist: 'user-edit',
	character: 'user',
	copyright: 'copyright',
	source: 'link',
	metadata: 'info-circle',
	rating: 'star',
	supertag: 'star-filled'
});

export const getTagTypePriority = (value: kurosearch.TagType) => {
	const priority = TAG_TYPES.indexOf(value);
	return priority >= 0 ? priority : 99; // unrecognized means very high
};
