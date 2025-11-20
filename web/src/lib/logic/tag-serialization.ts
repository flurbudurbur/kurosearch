import { BLOCKING_GROUP_TAGS } from './blocking-group-data';

export const serializeModifier = (value: kurosearch.TagModifier) => (value === '-' ? '-' : '');

export const serializeTagName = (value: string) => value.replaceAll(' ', '_');

export const serializeSearchableTag = (tag: kurosearch.SearchableTag) =>
	`${serializeModifier(tag.modifier)}${serializeTagName(tag.name)}`;

export const serializeSearchableTags = (tags: kurosearch.SearchableTag[]) => {
	const tagsByModifier = partitionTagsByModifier(tags);
	const parts = [...serializeTags([...tagsByModifier['+'], ...tagsByModifier['-']])];

	if (tagsByModifier['~'].length > 0) {
		parts.push(`( ${serializeTags(tagsByModifier['~']).join(' ~ ')} )`);
	}

	return parts.join('+');
};

export const serializeSearch = (
	tags: kurosearch.SearchableTag[],
	sortProperty: kurosearch.SortProperty,
	sortDirection: kurosearch.SortDirection,
	scoreValue: number,
	rating: kurosearch.Rating,
	scoreComparator: kurosearch.ScoreComparator,
	blockedContent: kurosearch.BlockingGroup[],
	supertags: kurosearch.Supertag[]
) => {
	const parts = [`sort:${sortProperty}:${sortDirection}`];

	if (scoreValue !== 0 || scoreComparator !== '>=') {
		parts.push(`score:${scoreComparator}${scoreValue}`);
	}

	if (rating !== 'all') {
		parts.push(`rating:${rating}`);
	}

	// Create a set of all tags (name+modifier) that have been seen
	const seenTagKeys = new Set(tags.map((t) => `${t.modifier}:${t.name}`));

	if (tags.length > 0) {
		parts.push(serializeSearchableTags(tags));
	}

	if (supertags.length > 0) {
		// For each supertag, filter out tags that have already been seen (in regular tags or previous supertags)
		const deduplicatedSupertags = supertags.map((supertag) => {
			const uniqueTags = supertag.tags.filter((tag) => {
				const key = `${tag.modifier}:${tag.name}`;
				if (seenTagKeys.has(key)) {
					return false; // Skip duplicate
				}
				seenTagKeys.add(key); // Mark as seen for future supertags
				return true;
			});

			return {
				...supertag,
				tags: uniqueTags
			};
		});

		// Only include supertags that have remaining tags after deduplication
		const supertagString = deduplicatedSupertags
			.filter((supertag) => supertag.tags.length > 0)
			.map((supertag) => serializeSearchableTags(supertag.tags))
			.join('+');

		if (supertagString) {
			parts.push(supertagString);
		}
	}

	if (blockedContent.length > 0) {
		const blockedTags: kurosearch.SearchableTag[] = blockedContent
			.flatMap((groupName) => BLOCKING_GROUP_TAGS[groupName as keyof typeof BLOCKING_GROUP_TAGS])
			.map((name) => ({ modifier: '-', name }));
		const blockedString = serializeSearchableTags(blockedTags);

		parts.push(blockedString);
	}

	return parts.join('+');
};

const serializeTags = (tags: kurosearch.SearchableTag[]) => tags.map(serializeSearchableTag);

const partitionTagsByModifier = (tags: kurosearch.SearchableTag[]) => {
	const partitions: Record<kurosearch.TagModifier, kurosearch.SearchableTag[]> = {
		'+': [],
		'-': [],
		'~': []
	};

	tags.forEach((t) => partitions[t.modifier].push(t));

	return partitions;
};
