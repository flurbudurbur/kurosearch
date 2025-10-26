import { derived } from 'svelte/store';
import activeTags from './active-tags-store';
import activeSupertags from './active-supertags-store';

/**
 * Derived store that combines active tags and active supertags into a single array.
 * This prevents unnecessary array concatenations on every component render.
 */
export const allActiveTags = derived(
	[activeTags, activeSupertags],
	([$activeTags, $activeSupertags]) => [...$activeTags, ...$activeSupertags]
);

/**
 * Derived store that flattens all active tags and supertags into a single deduplicated array of ModifiedTag.
 * Converts SearchableTag from supertags to ModifiedTag format with default count and type values.
 */
export const flattenedActiveTags = derived(
	[activeTags, activeSupertags],
	([$activeTags, $activeSupertags]): kurosearch.ModifiedTag[] => {
		// Early return for empty case
		if ($activeTags.length === 0 && $activeSupertags.length === 0) {
			return [];
		}

		const seen = new Set<string>();
		const result: kurosearch.ModifiedTag[] = [];

		// Add regular active tags first
		for (let i = 0; i < $activeTags.length; i++) {
			const tag = $activeTags[i];
			const name = tag.name;
			if (seen.has(name)) continue;
			seen.add(name);
			result.push(tag);
		}

		// Add tags from supertags, converting SearchableTag to ModifiedTag
		for (let i = 0; i < $activeSupertags.length; i++) {
			const tags = $activeSupertags[i].tags;
			for (let j = 0; j < tags.length; j++) {
				const tag = tags[j];
				const name = tag.name;
				if (seen.has(name)) continue;
				seen.add(name);
				result.push({
					modifier: tag.modifier,
					name: tag.name,
					count: 0,
					type: 'tag'
				});
			}
		}

		return result;
	}
);
