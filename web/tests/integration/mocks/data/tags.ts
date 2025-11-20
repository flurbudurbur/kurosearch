/**
 * Mock tag data for integration tests
 * Based on real Rule34 API autocomplete response structures
 */

export const createMockSuggestion = (overrides?: Partial<r34.Suggestion>): r34.Suggestion => ({
	value: 'tag',
	label: 'tag (100)',
	...overrides
});

// Comprehensive tag suggestions with real counts from Rule34 API
export const mockTagSuggestions: r34.Suggestion[] = [
	// General popular tags
	createMockSuggestion({ value: 'solo', label: 'solo (3549227)' }),
	createMockSuggestion({ value: 'solo_focus', label: 'solo_focus (731530)' }),
	createMockSuggestion({ value: 'solo_female', label: 'solo_female (610989)' }),
	createMockSuggestion({ value: 'solo_male', label: 'solo_male (167172)' }),
	createMockSuggestion({ value: 'solo_futa', label: 'solo_futa (116537)' }),
	createMockSuggestion({ value: 'smile', label: 'smile (1564979)' }),
	createMockSuggestion({ value: 'scenery', label: 'scenery (15000)' }),
	createMockSuggestion({ value: 'sound', label: 'sound (224664)' }),
	createMockSuggestion({ value: 'soles', label: 'soles (196760)' }),
	createMockSuggestion({ value: 'socks', label: 'socks (148710)' }),
	createMockSuggestion({ value: 'source_filmmaker', label: 'source_filmmaker (124910)' }),
	createMockSuggestion({ value: 'standing', label: 'standing (200000)' }),
	createMockSuggestion({ value: 'sfw', label: 'sfw (1000000)' }),
	// Specific tags with varying popularity
	createMockSuggestion({ value: 'smiley_face', label: 'smiley_face (14091)' }),
	createMockSuggestion({ value: 'smile_at_viewer', label: 'smile_at_viewer (7144)' }),
	createMockSuggestion({ value: 'smile_precure', label: 'smile_precure (5266)' }),
	createMockSuggestion({ value: 'smiler_(the_backrooms)', label: 'smiler_(the_backrooms) (960)' }),
	createMockSuggestion({ value: 'smilebomb', label: 'smilebomb (379)' }),
	createMockSuggestion({ value: 'smile_(company)', label: 'smile_(company) (248)' }),
	createMockSuggestion({ value: 'smile.dog', label: 'smile.dog (213)' }),
	// Character/series tags
	createMockSuggestion({ value: 'sonic_(series)', label: 'sonic_(series) (1745790)' }),
	createMockSuggestion({ value: 'pokemon', label: 'pokemon (8000000)' }),
	createMockSuggestion({ value: 'overwatch', label: 'overwatch (2000000)' })
];

// Filtered collections for specific test scenarios
export const mockGeneralTags = mockTagSuggestions.filter(
	(s) => !s.value.includes('_') && !s.value.includes('(') && !s.value.includes('.')
);

export const mockArtistTags: r34.Suggestion[] = [
	createMockSuggestion({ value: 'artist:shadman', label: 'artist:shadman (5000)' }),
	createMockSuggestion({ value: 'artist:sakimichan', label: 'artist:sakimichan (3500)' }),
	createMockSuggestion({ value: 'artist:zone', label: 'artist:zone (4200)' }),
	createMockSuggestion({ value: 'artist:jlullaby', label: 'artist:jlullaby (2800)' })
];

export const mockCharacterTags: r34.Suggestion[] = [
	createMockSuggestion({ value: 'sonic_(series)', label: 'sonic_(series) (1745790)' }),
	createMockSuggestion({ value: 'pharah', label: 'pharah (15000)' }),
	createMockSuggestion({ value: 'pokemon', label: 'pokemon (8000000)' }),
	createMockSuggestion({ value: 'overwatch', label: 'overwatch (2000000)' })
];

/**
 * Creates mock tag detail XML response
 * Based on real Rule34 API tag details endpoint structure
 */
export const createMockTagXml = (
	tagName: string,
	count: number = 100,
	tagType: string = '0',
	ambiguous: string = 'false'
): string => {
	return `<?xml version="1.0" encoding="UTF-8"?>
<tags type="array">
	<tag type="${tagType}" count="${count}" name="${tagName}" ambiguous="${ambiguous}" id="108"/>
</tags>`;
};
