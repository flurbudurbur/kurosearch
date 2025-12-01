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
	import { get } from 'svelte/store';
	import SearchForm from './SearchForm.svelte';
	import apiKey from '$lib/store/api-key-store';
	import userId from '$lib/store/user-id-store';
	import pageNavigationEnabled from '$lib/store/page-navigation-enabled-store';
	import type { Component } from 'svelte';
	import { APP_NAME, getCanonicalUrl } from '$lib/logic/app-config';
	import { searchActions } from '$lib/store/search-actions-store';
	import NewPostsBanner from '$lib/components/kurosearch/results/NewPostsBanner.svelte';
	import { connect, subscribe, unsubscribe, getWebSocketClient } from '$lib/websocket';
	import type { NewPostData, ServerMessage } from '$lib/types/websocket';
	import { BLOCKING_GROUP_TAGS } from '$lib/logic/blocking-group-data';
	import './global.scss';

	// Debug mode helper (enabled in development or via ?debug URL parameter)
	const isDebugMode = () => {
		if (import.meta.env.DEV) return true;
		if (typeof window === 'undefined') return false;
		return new URLSearchParams(window.location.search).has('debug');
	};

	const debugLog = (...args: unknown[]) => {
		if (isDebugMode()) {
			console.log('[LivePosts]', ...args);
		}
	};

	// No server-side data needed for static frontend

	let loading = $state(false);
	let error: Error | undefined = $state();
	let nextFocus = 0;
	let newPostsAvailable = $state(0);
	let pendingNewPosts: kurosearch.Post[] = $state([]);
	let unsubscribeWebSocket: (() => void) | null = null;
	let seenPostIds = new Set<number>();

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
		url: getCanonicalUrl(),
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
			console.warn(e);
		} finally {
			loading = false;
		}
	};

	const getFirstPage = async () => {
		// Unsubscribe from previous search's WebSocket updates
		unsubscribeFromLivePosts();

		results.reset();
		nextFocus = 0;
		newPostsAvailable = 0;
		pendingNewPosts = [];

		await executeSearch(async () => {
			const [page, count] = await createDefaultSearch().getPageAndCount();
			results.addPage(page, count);
		});

		// Resubscribe to WebSocket for new search criteria
		if (browser && $results.postCount > 0) {
			subscribeToLivePosts();
		}
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

	/**
	 * Convert WebSocket NewPostData to kurosearch.Post format
	 */
	const formatWebSocketPost = (newPost: NewPostData): kurosearch.Post => {
		// Parse tag strings to create Tag objects with basic properties
		const tags: kurosearch.Tag[] = newPost.tags.map((tagName) => ({
			name: tagName,
			count: 0, // Count not provided by WebSocket
			type: 'tag' as kurosearch.TagType
		}));

		// Convert rating format (WebSocket uses 's', 'q', 'e', frontend uses full names)
		const ratingMap: Record<string, kurosearch.Rating> = {
			s: 'safe',
			safe: 'safe',
			q: 'questionable',
			questionable: 'questionable',
			e: 'explicit',
			explicit: 'explicit'
		};
		const rating = ratingMap[newPost.rating.toLowerCase()] || 'explicit';

		return {
			id: newPost.id,
			preview_url: newPost.preview_url,
			sample_url: newPost.sample_url,
			file_url: newPost.file_url,
			rating,
			score: newPost.score,
			tags,
			// Set defaults for fields not provided by WebSocket
			comment_count: 0,
			height: 0,
			width: 0,
			sample_height: 0,
			sample_width: 0,
			change: 0,
			parent_id: undefined,
			source: '',
			status: 'active',
			type: '' // Will be determined by file extension
		};
	};

	/**
	 * Check if a WebSocket post matches the current search criteria
	 */
	const matchesCurrentSearch = (newPost: NewPostData): boolean => {
		// Explicitly get current store values (required for WebSocket callback context)
		const currentActiveTags = get(activeTags);
		const currentBlockedContent = get(blockedContent);
		const currentFilter = get(filter);

		debugLog('Checking post:', newPost.id, 'rating:', newPost.rating, 'score:', newPost.score);
		debugLog(
			'Post tags:',
			newPost.tags.slice(0, 10).join(', '),
			newPost.tags.length > 10 ? `... (+${newPost.tags.length - 10} more)` : ''
		);

		// Check if we've already seen this post
		if (seenPostIds.has(newPost.id)) {
			debugLog('REJECTED: Already seen post', newPost.id);
			return false;
		}

		const postTags = newPost.tags;

		// Filter by active tags (user's search query)
		if (currentActiveTags.length > 0) {
			const hasAllRequiredTags = currentActiveTags.every((searchTag) => {
				const tagName = searchTag.name;
				const modifier = searchTag.modifier;

				// Check if tag exists in post
				const tagExists = postTags.some((postTag) =>
					postTag.toLowerCase().includes(tagName.toLowerCase())
				);

				// Handle modifiers
				if (modifier === '-') {
					// Exclude: post should NOT have this tag
					return !tagExists;
				} else {
					// Include (default or +): post MUST have this tag
					return tagExists;
				}
			});

			if (!hasAllRequiredTags) {
				debugLog(
					'REJECTED: Active tags filter - required tags:',
					currentActiveTags.map((t) => `${t.modifier || '+'}${t.name}`).join(', ')
				);
				return false;
			}
		}

		// Filter by blocked content
		// Convert Record<BlockingGroup, boolean> to array of enabled groups
		const enabledBlockedGroups = Object.entries(currentBlockedContent)
			.filter(([_, enabled]) => enabled)
			.map(([group, _]) => group as kurosearch.BlockingGroup);

		if (enabledBlockedGroups.length > 0) {
			// Get all tags for enabled blocking groups
			const blockedTags = enabledBlockedGroups
				.flatMap((groupName) => BLOCKING_GROUP_TAGS[groupName])
				.map((tag) => tag.toLowerCase());

			// Check if post has any blocked tags
			let matchedBlockedTag: string | null = null;
			const hasBlockedTag = blockedTags.some((blockedTag) =>
				postTags.some((postTag) => {
					const lowerPostTag = postTag.toLowerCase();
					let matches = false;
					// Simple wildcard matching (prefix/suffix)
					if (blockedTag.startsWith('*') && blockedTag.endsWith('*')) {
						matches = lowerPostTag.includes(blockedTag.slice(1, -1));
					} else if (blockedTag.startsWith('*')) {
						matches = lowerPostTag.endsWith(blockedTag.slice(1));
					} else if (blockedTag.endsWith('*')) {
						matches = lowerPostTag.startsWith(blockedTag.slice(0, -1));
					} else {
						matches = lowerPostTag === blockedTag;
					}
					if (matches) {
						matchedBlockedTag = `${postTag} (matched: ${blockedTag})`;
					}
					return matches;
				})
			);

			if (hasBlockedTag) {
				debugLog(
					'REJECTED: Blocked content - groups:',
					enabledBlockedGroups.join(', '),
					'- matched:',
					matchedBlockedTag
				);
				return false;
			}
		}

		// Filter by rating
		if (currentFilter.rating !== 'all') {
			const ratingMap: Record<string, string> = {
				s: 'safe',
				safe: 'safe',
				q: 'questionable',
				questionable: 'questionable',
				e: 'explicit',
				explicit: 'explicit'
			};
			const postRating = ratingMap[newPost.rating.toLowerCase()] || 'explicit';
			if (postRating !== currentFilter.rating) {
				debugLog('REJECTED: Rating filter - post:', postRating, 'filter:', currentFilter.rating);
				return false;
			}
		}

		// Filter by score
		if (currentFilter.scoreValue !== undefined && currentFilter.scoreValue !== null) {
			const scoreValue = Number(currentFilter.scoreValue);
			if (!isNaN(scoreValue) && scoreValue > 0) {
				if (currentFilter.scoreComparator === '>=') {
					if (newPost.score < scoreValue) {
						debugLog(
							'REJECTED: Score filter - post:',
							newPost.score,
							'filter:',
							`>= ${scoreValue}`
						);
						return false;
					}
				} else if (currentFilter.scoreComparator === '<=') {
					if (newPost.score > scoreValue) {
						debugLog(
							'REJECTED: Score filter - post:',
							newPost.score,
							'filter:',
							`<= ${scoreValue}`
						);
						return false;
					}
				}
			}
		}

		debugLog('ACCEPTED: Post', newPost.id, 'passed all filters');
		return true;
	};

	/**
	 * Subscribe to WebSocket live-posts channel
	 */
	const subscribeToLivePosts = () => {
		// Initialize seen post IDs with current results
		seenPostIds.clear();
		$results.posts.forEach((post) => seenPostIds.add(post.id));

		// Connect and subscribe to live-posts channel
		connect();
		subscribe(['live-posts']);

		// Listen for new-post messages
		const client = getWebSocketClient();
		if (client) {
			unsubscribeWebSocket = client.onMessage((message: ServerMessage) => {
				if (message.type === 'new-post' && message.data) {
					const newPost = message.data;

					// Filter by current search criteria
					if (matchesCurrentSearch(newPost)) {
						// Convert to kurosearch.Post format
						const formattedPost = formatWebSocketPost(newPost);

						// Add to pending posts (at the beginning)
						pendingNewPosts = [formattedPost, ...pendingNewPosts];
						newPostsAvailable = pendingNewPosts.length;

						// Track this post ID
						seenPostIds.add(newPost.id);
					}
				}
			});
		}
	};

	/**
	 * Unsubscribe from WebSocket live-posts
	 */
	const unsubscribeFromLivePosts = () => {
		if (unsubscribeWebSocket) {
			unsubscribeWebSocket();
			unsubscribeWebSocket = null;
		}
		unsubscribe(['live-posts']);
		seenPostIds.clear();
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
			// Always fetch fresh posts for static frontend
			await getFirstPage();

			// Subscribe to WebSocket live-posts after successful initial load
			if ($results.postCount > 0) {
				subscribeToLivePosts();
			}
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', keybinds);
			unsubscribeFromLivePosts();
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
	<link rel="canonical" href="{getCanonicalUrl()}/" />

	<!-- Open Graph tags for social media -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{getCanonicalUrl()}/" />
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
		{JSON.stringify(structuredData)}
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

{#if newPostsAvailable > 0}
	<NewPostsBanner count={newPostsAvailable} onload={loadNewPosts} ondismiss={dismissNewPosts} />
{/if}

<ResultHeader {loading} />

{#if error}
	<SearchError {error} />
{:else if $results.requested}
	<section>
		{#if $results.postCount === 0}
			<ZeroResults />
		{:else}
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
		flex-grow: 1;
		border-radius: var(--border-radius-large);
		animation: sweep ease-in-out 3s infinite;
	}
</style>
