export const TAG_MODIFIER_DATA = [
	{
		modifier: '+',
		icon: 'plus',
		hint: 'Included. Tags will be included in the search.',
		name: 'include',
		title: 'Include tag'
	},
	{
		modifier: '~',
		icon: 'tilde',
		hint: 'Optional. At least one of all optional tags will on each post.',
		name: 'optional',
		title: 'Try including tag'
	},
	{
		modifier: '-',
		icon: 'minus',
		hint: 'Blocked. Tags will be blocked.',
		name: 'exclude',
		title: 'Exclude tag'
	}
] as const;

export const MODIFIERS_ICONS = Object.freeze(
	TAG_MODIFIER_DATA.reduce(
		(acc, m) => {
			acc[m.modifier] = m.icon;
			return acc;
		},
		{} as Record<string, string>
	)
);

export const MODIFIERS_HINTS = Object.freeze(
	TAG_MODIFIER_DATA.reduce(
		(acc, m) => {
			acc[m.modifier] = m.hint;
			return acc;
		},
		{} as Record<string, string>
	)
);

export const MODIFIER_NAMES = Object.freeze(
	TAG_MODIFIER_DATA.reduce(
		(acc, m) => {
			acc[m.modifier] = m.name;
			return acc;
		},
		{} as Record<string, string>
	)
);

export const MODIFIER_TITLES = Object.freeze(
	TAG_MODIFIER_DATA.reduce(
		(acc, m) => {
			acc[m.modifier] = m.title;
			return acc;
		},
		{} as Record<string, string>
	)
);
