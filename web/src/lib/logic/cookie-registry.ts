import { StoreKey } from '$lib/store/store-keys';

export type CookieCategory = 'essential' | 'preferences' | 'credentials';

export interface CookieInfo {
	key: string;
	storageKey: string;
	description: string;
	category: CookieCategory;
}

// Record ensures all StoreKey values must be present (TypeScript enforced)
const cookieDescriptions: Record<StoreKey, { description: string; category: CookieCategory }> = {
	[StoreKey.CookiesAccepted]: {
		description: 'Stores your consent to the terms of use',
		category: 'essential'
	},
	[StoreKey.LocalstorageEnabled]: {
		description: 'Checks if localStorage is available in your browser',
		category: 'essential'
	},
	[StoreKey.Theme]: {
		description: 'Your selected color theme',
		category: 'preferences'
	},
	[StoreKey.ActiveTags]: {
		description: 'Your current search tags',
		category: 'preferences'
	},
	[StoreKey.ActiveSupertags]: {
		description: 'Your active supertag filters',
		category: 'preferences'
	},
	[StoreKey.BlockedContent]: {
		description: 'Content you have chosen to hide',
		category: 'preferences'
	},
	[StoreKey.ResultColumns]: {
		description: 'Number of columns in the results grid',
		category: 'preferences'
	},
	[StoreKey.Supertags]: {
		description: 'Your saved supertag definitions',
		category: 'preferences'
	},
	[StoreKey.Filter]: {
		description: 'Your current filter settings',
		category: 'preferences'
	},
	[StoreKey.Sort]: {
		description: 'Your sort preference',
		category: 'preferences'
	},
	[StoreKey.Results]: {
		description: 'Number of results per page',
		category: 'preferences'
	},
	[StoreKey.AlwaysLoop]: {
		description: 'Whether videos should loop automatically',
		category: 'preferences'
	},
	[StoreKey.HighResolutionEnabled]: {
		description: 'Whether to load high-resolution images',
		category: 'preferences'
	},
	[StoreKey.WideLayoutEnabled]: {
		description: 'Whether to use wide layout mode',
		category: 'preferences'
	},
	[StoreKey.FullscreenHintDone]: {
		description: 'Whether the fullscreen hint has been shown',
		category: 'preferences'
	},
	[StoreKey.AutoplayFullscreenEnabled]: {
		description: 'Whether autoplay is enabled in fullscreen',
		category: 'preferences'
	},
	[StoreKey.AutoplayFullscreenDelay]: {
		description: 'Delay before autoplay in fullscreen (seconds)',
		category: 'preferences'
	},
	[StoreKey.TagsShortcut]: {
		description: 'Your tag shortcut preference',
		category: 'preferences'
	},
	[StoreKey.GifPreloadEnabled]: {
		description: 'Whether to preload GIF animations',
		category: 'preferences'
	},
	[StoreKey.PageNavigationEnabled]: {
		description: 'Whether page navigation is enabled',
		category: 'preferences'
	},
	[StoreKey.SavedPosts]: {
		description: 'Your bookmarked/saved posts',
		category: 'preferences'
	},
	[StoreKey.BackgroundRefreshEnabled]: {
		description: 'Whether background refresh is enabled',
		category: 'preferences'
	},
	[StoreKey.BackgroundRefreshInterval]: {
		description: 'Interval for background refresh (milliseconds)',
		category: 'preferences'
	},
	[StoreKey.ColumnWidth]: {
		description: 'Width of columns in the results grid',
		category: 'preferences'
	},
	[StoreKey.LastSeenVersion]: {
		description: 'Last app version seen (for changelog notifications)',
		category: 'preferences'
	},
	[StoreKey.ApiKey]: {
		description: 'Your Rule34 API key (if provided)',
		category: 'credentials'
	},
	[StoreKey.UserId]: {
		description: 'Your Rule34 user ID (if provided)',
		category: 'credentials'
	}
};

export function getCookieRegistry(): CookieInfo[] {
	return (
		Object.entries(cookieDescriptions) as [
			StoreKey,
			{ description: string; category: CookieCategory }
		][]
	).map(([storageKey, meta]) => ({
		key: Object.entries(StoreKey).find(([_, v]) => v === storageKey)?.[0] ?? storageKey,
		storageKey,
		description: meta.description,
		category: meta.category
	}));
}

export function getCookiesByCategory(category: CookieCategory): CookieInfo[] {
	return getCookieRegistry().filter((c) => c.category === category);
}
