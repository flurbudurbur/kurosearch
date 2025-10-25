import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';

describe('simple stores', () => {
	beforeEach(async () => {
		// Reset modules to get fresh store instances
		await import('vitest').then((vitest) => vitest.vi.resetModules());
	});

	describe('all-active-tags-store', () => {
		it('combines active tags and active supertags', async () => {
			const { allActiveTags } = await import('$lib/store/all-active-tags-store');
			const activeTags = await import('$lib/store/active-tags-store');
			const activeSupertags = await import('$lib/store/active-supertags-store');

			// Add some tags
			activeTags.default.addOrReplace({ name: 'test', modifier: '+', type: 0 });
			activeSupertags.default.addOrReplace({
				name: 'super',
				tags: [{ name: 'tag1', modifier: '+', type: 0 }]
			});

			const combined = get(allActiveTags);
			expect(combined).toHaveLength(2);
			expect(combined[0]).toMatchObject({ name: 'test' });
			expect(combined[1]).toMatchObject({ name: 'super' });
		});
	});

	describe('blur-enabled-store', () => {
		it('starts with false by default', async () => {
			const { blurEnabled } = await import('$lib/store/blur-enabled-store');
			expect(get(blurEnabled)).toBe(false);
		});

		it('can be set to true', async () => {
			const { blurEnabled } = await import('$lib/store/blur-enabled-store');
			blurEnabled.set(true);
			expect(get(blurEnabled)).toBe(true);
		});
	});

	describe('search-actions-store', () => {
		it('has default refreshSearch that warns when called', async () => {
			const { searchActions } = await import('$lib/store/search-actions-store');
			const actions = get(searchActions);
			expect(actions).toHaveProperty('refreshSearch');
			expect(typeof actions.refreshSearch).toBe('function');
		});

		it('can be updated with custom actions', async () => {
			const { searchActions } = await import('$lib/store/search-actions-store');
			let called = false;
			const customAction = () => {
				called = true;
			};
			searchActions.set({ refreshSearch: customAction });
			const actions = get(searchActions);
			actions.refreshSearch();
			expect(called).toBe(true);
		});
	});
});
