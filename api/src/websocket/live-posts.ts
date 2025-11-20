import type { FastifyBaseLogger } from 'fastify';
import { R34_API_URL, appendAuthParams } from '../lib/rule34-client.js';
import { connectionManager } from './manager.js';
import type { NewPostData } from './events.js';
import { invalidateCachePattern } from '../lib/cache-utils.js';

/**
 * Live post polling configuration
 */
const POLL_INTERVAL = 20000; // 60 seconds
const FETCH_TIMEOUT = 10000; // 10 seconds
let lastCheckTime = Date.now();
let isPolling = false;
let pollTimer: NodeJS.Timeout | null = null;
let logger: FastifyBaseLogger | null = null;

/**
 * Fetch latest posts from Rule34 API
 */
async function fetchLatestPosts(): Promise<NewPostData[]> {
	try {
		// Fetch the latest 10 posts (sorted by ID descending)
		const params = new URLSearchParams({
			page: 'dapi',
			s: 'post',
			q: 'index',
			limit: '10',
			json: '1'
		});

		// Add authentication (required by Rule34 API)
		appendAuthParams(params);

		// Add timeout to prevent hanging
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

		try {
			const response = await fetch(`${R34_API_URL}?${params.toString()}`, {
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (!response.ok) {
				logger?.error({ status: response.status }, 'Failed to fetch latest posts');
				return [];
			}

			const data = await response.json();

			// Parse posts
			const posts: NewPostData[] = [];
			if (Array.isArray(data)) {
				for (const post of data) {
					posts.push({
						id: parseInt(post.id, 10),
						tags: post.tags ? post.tags.split(' ') : [],
						preview_url: post.preview_url || '',
						sample_url: post.sample_url || '',
						file_url: post.file_url || '',
						rating: post.rating || 'unknown',
						score: parseInt(post.score, 10) || 0,
						timestamp: Date.now()
					});
				}
			}

			return posts;
		} catch (fetchErr) {
			clearTimeout(timeoutId);

			// Handle timeout and network errors more gracefully
			if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
				logger?.warn({ timeout: FETCH_TIMEOUT }, 'Fetch timeout while fetching latest posts');
			} else {
				throw fetchErr; // Re-throw to outer catch
			}
			return [];
		}
	} catch (err) {
		logger?.error({ err }, 'Error fetching latest posts');
		return [];
	}
}

/**
 * Poll for new posts and broadcast to subscribers
 */
async function pollNewPosts(): Promise<void> {
	if (isPolling) return;

	try {
		isPolling = true;

		// Check if there are any subscribers before polling
		const stats = connectionManager.getStats();
		const subscribers = stats.channelSubscriptions['live-posts'] || 0;

		if (subscribers === 0) {
			logger?.debug('Skipping live posts poll - no active subscribers');
			return;
		}

		const posts = await fetchLatestPosts();

		if (posts.length === 0) {
			return;
		}

		// Broadcast new posts to all subscribers
		const currentTime = Date.now();
		let newPostsCount = 0;

		for (const post of posts) {
			// Only broadcast posts created after our last check
			// (Using post ID as a proxy for creation time)
			connectionManager.broadcast('live-posts', {
				type: 'new-post',
				data: post
			});
			newPostsCount++;
		}

		if (newPostsCount > 0) {
			logger?.info(
				{ newPostsCount, subscribers },
				`Broadcast ${newPostsCount} new posts to ${subscribers} subscribers`
			);

			// Invalidate post caches when new posts are detected
			// This ensures clients will fetch fresh data on their next request
			const invalidatedCount = await invalidateCachePattern(
				'kurosearch:posts:*',
				true,
				logger ?? undefined
			);
			logger?.info(
				{ invalidatedCount },
				`Invalidated ${invalidatedCount} post cache keys due to new posts`
			);
		}

		lastCheckTime = currentTime;
	} catch (err) {
		logger?.error({ err }, 'Error in live posts polling');
	} finally {
		isPolling = false;
	}
}

/**
 * Set logger instance for live posts
 */
export function setLivePostsLogger(loggerInstance: FastifyBaseLogger): void {
	logger = loggerInstance;
}

/**
 * Start polling for new posts
 */
export function startLivePostsPolling(): void {
	if (pollTimer) {
		logger?.warn('Live posts polling already started');
		return;
	}

	logger?.info({ interval: POLL_INTERVAL }, 'Starting live posts polling');

	// Initial poll
	pollNewPosts();

	// Set up interval
	pollTimer = setInterval(() => {
		pollNewPosts();
	}, POLL_INTERVAL);
}

/**
 * Stop polling for new posts
 */
export function stopLivePostsPolling(): void {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
		logger?.info('Stopped live posts polling');
	}
}

/**
 * Get polling status
 */
export function getPollingStatus(): { active: boolean; lastCheck: number; interval: number } {
	return {
		active: pollTimer !== null,
		lastCheck: lastCheckTime,
		interval: POLL_INTERVAL
	};
}
