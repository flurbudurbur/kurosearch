export const TAG_TYPE_DATA = [
	{ type: 'artist', icon: 'user-edit' },
	{ type: 'character', icon: 'user' },
	{ type: 'copyright', icon: 'copyright' },
	{ type: 'source', icon: 'link' },
	{ type: 'metadata', icon: 'info-circle' },
	{ type: 'rating', icon: 'star' },
	{ type: 'tag', icon: null },
	{ type: 'general', icon: null },
	{ type: 'ambiguous', icon: null },
	{ type: 'supertag', icon: 'star-filled' }
] as const;

export const TAG_TYPES = TAG_TYPE_DATA.map((t) => t.type);

export const TAG_TYPES_WITH_ICONS = Object.freeze(
	TAG_TYPE_DATA.filter((t) => t.icon !== null).reduce(
		(acc, t) => {
			acc[t.type] = t.icon;
			return acc;
		},
		{} as Record<string, string>
	)
);

export const getTagTypePriority = (value: kurosearch.TagType) => {
	const priority = TAG_TYPES.indexOf(value);
	return priority >= 0 ? priority : 99; // unrecognized means very high
};
