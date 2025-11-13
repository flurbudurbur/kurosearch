<script lang="ts">
	import { browser } from '$app/environment';
	import SearchError from '$lib/components/kurosearch/error-search/SearchError.svelte';
	import NoMoreResults from '$lib/components/kurosearch/results/NoMoreResults.svelte';
	import ResultHeader from '$lib/components/kurosearch/results/ResultHeader.svelte';
	import Results from '$lib/components/kurosearch/results/Results.svelte';
	import ZeroResults from '$lib/components/kurosearch/results/ZeroResults.svelte';
	import ScrollUpButton from '$lib/components/pure/button/icon-button/ScrollUpButton.svelte';
	import IntersectionDetector from '$lib/components/pure/intersection-detector/IntersectionDetector.svelte';
	import TextButton from '$lib/components/pure/button/TextButton.svelte';
	import { SearchBuilder } from '$lib/logic/search-builder';
	import activeSupertags from '$lib/store/active-supertags-store';
	import activeTags from '$lib/store/active-tags-store';
	import blockedContent from '$lib/store/blocked-content-store';
	import filter from '$lib/store/filter-store';
	import results from '$lib/store/results-store';
	import resultColumns from '$lib/store/result-columns-store';
	import sort from '$lib/store/sort-store';
	import { onDestroy, onMount } from 'svelte';
	import SearchForm from './SearchForm.svelte';
	import apiKey from '$lib/store/api-key-store';
	import userId from '$lib/store/user-id-store';
	import pageNavigationEnabled from '$lib/store/page-navigation-enabled-store';
	import type { Component } from 'svelte';
	import { APP_NAME } from '$lib/logic/app-config';
	import { searchActions } from '$lib/store/search-actions-store';
	import { backgroundRefreshService } from '$lib/logic/background-refresh';
	import backgroundRefreshEnabled from '$lib/store/background-refresh-enabled-store';
	import backgroundRefreshInterval from '$lib/store/background-refresh-interval-store';
	import NewPostsBanner from '$lib/components/kurosearch/results/NewPostsBanner.svelte';
	import './global.scss';

	let { data } = $props();

	let loading = $state(false);
	let error: Error | undefined = $state();
	let nextFocus = 0;
	let newPostsAvailable = $state(0);
	let pendingNewPosts: kurosearch.Post[] = $state([]);

	// Lazy-load pagination components
	let PageNavigation: Component<{ onpagechange: (pid: number) => void }> | undefined =
		$state(undefined);
	let PageJump: Component<{ onpagechange: (pid: number) => void }> | undefined = $state(undefined);

	// Used in <svelte:head> for JSON-LD structured data
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: APP_NAME,
		url: data.canonicalUrl,
		description:
			'Simple and powerful Rule34 browsing site with a focus on simplicity and user experience.',
		applicationCategory: 'MultimediaApplication',
		operatingSystem: 'Any',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		}
	};

	const createDefaultSearch = () => {
		// Use 50 for single column, 100 for multi-column layouts
		const pageSize = $resultColumns === '1' ? 50 : 100;

		return new SearchBuilder()
			.withApiKey($apiKey)
			.withUserId($userId)
			.withPid($results.pageCount)
			.withTags($activeTags)
			.withBlockedContent($blockedContent)
			.withSortProperty($sort.property)
			.withSortDirection($sort.direction)
			.withScoreValue($filter.scoreValue)
			.withScoreComparator($filter.scoreComparator)
			.withRating($filter.rating)
			.withSupertags($activeSupertags)
			.withPageSize(pageSize);
	};

	const executeSearch = async (operation: () => Promise<void>) => {
		if (loading) {
			return;
		}

		error = undefined;
		loading = true;

		try {
			await operation();
		} catch (e) {
			error = e as Error;
			console.warn('Search execution failed:', e);
		} finally {
			loading = false;
		}
	};

	const getFirstPage = async () => {
		results.reset();
		nextFocus = 0;
		newPostsAvailable = 0;
		pendingNewPosts = [];

		await executeSearch(async () => {
			const [page, count] = await createDefaultSearch().getPageAndCount();
			results.addPage(page, count);
		});

		// Start background refresh after successful search
		startBackgroundRefresh();
	};

	const startBackgroundRefresh = () => {
		if (!browser || !$backgroundRefreshEnabled) return;

		const search = createDefaultSearch();
		const tagsString = search.getTagsString();

		backgroundRefreshService.start(
			tagsString,
			$apiKey,
			$userId,
			$backgroundRefreshInterval,
			(count, posts) => {
				newPostsAvailable = count;
				pendingNewPosts = posts;
			}
		);
	};

	const loadNewPosts = () => {
		if (pendingNewPosts.length > 0) {
			results.prependPosts(pendingNewPosts);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		newPostsAvailable = 0;
		pendingNewPosts = [];
	};

	const dismissNewPosts = () => {
		newPostsAvailable = 0;
		pendingNewPosts = [];
	};

	const getPage = async (pid: number) => {
		results.resetPosts();
		nextFocus = 0;

		await executeSearch(async () => {
			const page = await createDefaultSearch().withPid(pid).getPage();
			results.setPage(page, pid);
		});
	};

	const getNextPage = async () => {
		await executeSearch(async () => {
			const page = await createDefaultSearch().getPage();
			results.addPage(page);
		});
	};

	const keybinds = (event: KeyboardEvent) => {
		if (event.ctrlKey && event.key === 'ArrowDown') {
			const posts = document.getElementsByClassName('post-media');
			// @ts-expect-error - they will be focusable
			posts[nextFocus].focus();
			nextFocus = Math.min(nextFocus + 1, Math.max(0, posts.length - 1));
		}

		if (event.ctrlKey && event.key === 'ArrowUp') {
			const posts = document.getElementsByClassName('post-media');
			// @ts-expect-error - they will be focusable
			posts[nextFocus].focus();
			nextFocus = Math.max(nextFocus - 1, 0);
		}
	};

	onMount(async () => {
		if (browser) {
			document.addEventListener('keydown', keybinds);
		}

		// Set up search actions for other components to use
		searchActions.set({
			refreshSearch: getFirstPage
		});

		// Auto-load results on homepage
		if (browser) {
			// PRIORITY 1: Use server-provided fresh data (on page load/refresh)
			if (data.initialPosts && data.initialPosts.length > 0) {
				// Clear any cached data first to prevent flash of stale content
				results.reset();
				results.addPage(data.initialPosts, data.totalCount);
				startBackgroundRefresh();
			}
			// PRIORITY 2: Use cached data if no server data (e.g., SPA navigation)
			else if ($results.requested) {
				// User has cached results from previous session
				// Fetch fresh data in background without showing loading state
				const originalLoading = loading;
				try {
					const [page, count] = await createDefaultSearch().getPageAndCount();
					results.reset();
					results.addPage(page, count);
					startBackgroundRefresh();
				} catch (e) {
					console.warn('Background refresh failed:', e);
					// Keep showing cached results on error
				}
				loading = originalLoading;
			}
			// PRIORITY 3: No data at all, fetch fresh
			else {
				await getFirstPage();
			}
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', keybinds);
			backgroundRefreshService.stop();
		}
	});

	// Lazy-load pagination components when page navigation is enabled
	$effect(() => {
		if ($pageNavigationEnabled && !PageNavigation) {
			(async () => {
				const [navModule, jumpModule] = await Promise.all([
					import('$lib/components/kurosearch/page-navigation/PageNavigation.svelte'),
					import('$lib/components/kurosearch/page-navigation/PageJump.svelte')
				]);
				PageNavigation = navModule.default;
				PageJump = jumpModule.default;
			})();
		}
	});
</script>

<svelte:head>
	<title>{APP_NAME} - Rule34 browser</title>
	<meta
		name="description"
		content="Simple and powerful Rule34 browsing site with a focus on simplicity and user experience."
	/>

	<!-- Canonical URL -->
	<link rel="canonical" href="{data.canonicalUrl}/" />

	<!-- Open Graph tags for social media -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{data.canonicalUrl}/" />
	<meta property="og:title" content="{APP_NAME} - Rule34 browser" />
	<meta
		property="og:description"
		content="Simple and powerful Rule34 browsing site with a focus on simplicity and user experience."
	/>
	<meta property="og:site_name" content={APP_NAME} />

	<!-- Twitter Card tags -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{APP_NAME} - Rule34 browser" />
	<meta
		name="twitter:description"
		content="Simple and powerful Rule34 browsing site with a focus on simplicity and user experience."
	/>

	<!-- Structured Data (JSON-LD) for rich snippets -->

	<script type="application/ld+json">
{
		JSON.stringify(structuredData);
	}
	</script>
</svelte:head>

<!--<LynxMain />-->

<div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
	{#if loading}
		Loading search results...
	{/if}
</div>

<SearchForm {loading} onsubmit={getFirstPage} />

{#if $pageNavigationEnabled && PageJump}
	<PageJump onpagechange={getPage} />
{/if}

<ResultHeader {loading} />

{#if error}
	<SearchError {error} />
{:else if $results.requested}
	<section>
		{#if $results.postCount === 0}
			<ZeroResults />
		{:else}
			{#if newPostsAvailable > 0}
				<NewPostsBanner
					count={newPostsAvailable}
					onload={loadNewPosts}
					ondismiss={dismissNewPosts}
				/>
			{/if}
			<Results onendreached={getNextPage}>
				{#snippet intersectionDetector()}
					{#if !$pageNavigationEnabled && $results.posts.length < $results.postCount}
						<IntersectionDetector
							absoluteTop={undefined}
							rootMargin="1200px"
							onintersection={getNextPage}
						/>
					{/if}
				{/snippet}
			</Results>
			{#if $results.posts.length === $results.postCount}
				<NoMoreResults />
			{:else if $pageNavigationEnabled && PageNavigation}
				<PageNavigation
					onpagechange={(pid) => {
						getPage(pid);
						document.getElementById('result-header')?.scrollIntoView();
					}}
				/>
			{:else}
				<IntersectionDetector
					absoluteTop={undefined}
					rootMargin="1200px"
					onintersection={getNextPage}
				/>
				<TextButton title="Load more posts" onclick={getNextPage}>Load more</TextButton>
			{/if}
		{/if}
	</section>
	<ScrollUpButton />
{/if}

{#if loading}
	<div></div>
{/if}

<style lang="scss">
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	:global(main) {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
	}

	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--grid-gap);
	}

	@keyframes sweep {
		0% {
			background: var(--background-1);
		}
		50% {
			background: var(--background-2);
		}
		100% {
			background: var(--background-1);
		}
	}

	div {
		contain: strict;
		height: 100vh;
		border-radius: var(--border-radius-large);
		animation: sweep ease-in-out 3s infinite;
	}
</style>
