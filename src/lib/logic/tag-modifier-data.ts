export const MODIFIERS_ICONS = Object.freeze({
	'+': 'plus',
	'~': 'tilde',
	'-': 'minus'
} as const satisfies Record<kurosearch.TagModifier, string>);

export const MODIFIERS_HINTS = Object.freeze({
	'+': 'Included. Tags will be included in the search.',
	'~': 'Optional. At least one of all optional tags will on each post.',
	'-': 'Blocked. Tags will be blocked.'
} as const satisfies Record<kurosearch.TagModifier, string>);

export const MODIFIER_NAMES = Object.freeze({
	'+': 'include',
	'~': 'optional',
	'-': 'exclude'
} as const satisfies Record<kurosearch.TagModifier, string>);

export const MODIFIER_TITLES = Object.freeze({
	'+': 'Include tag',
	'~': 'Try including tag',
	'-': 'Exclude tag'
} as const satisfies Record<kurosearch.TagModifier, string>);
