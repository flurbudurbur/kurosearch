import { postsClient } from './api-client';

export type NewPostsCallback = (count: number, newPosts: kurosearch.Post[]) => void;

export class BackgroundRefreshService {
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private isEnabled = false;
	private currentTags = '';
	private currentApiKey = '';
	private currentUserId = '';
	private latestPostIds = new Set<number>();
	private callback: NewPostsCallback | null = null;

	constructor() {}

	/**
	 * Start polling for new posts
	 */
	start(
		tags: string,
		apiKey: string,
		userId: string,
		intervalMs: number,
		onNewPosts: NewPostsCallback
	) {
		// Stop any existing interval
		this.stop();

		this.isEnabled = true;
		this.currentTags = tags;
		this.currentApiKey = apiKey;
		this.currentUserId = userId;
		this.callback = onNewPosts;

		// Get initial set of post IDs from the first page
		this.initializePostIds();

		// Start polling
		this.intervalId = setInterval(() => {
			this.checkForNewPosts();
		}, intervalMs);
	}

	/**
	 * Stop polling
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.isEnabled = false;
		this.latestPostIds.clear();
		this.callback = null;
	}

	/**
	 * Update the search parameters without stopping
	 */
	updateSearch(tags: string, apiKey: string, userId: string) {
		this.currentTags = tags;
		this.currentApiKey = apiKey;
		this.currentUserId = userId;
		this.latestPostIds.clear();
		this.initializePostIds();
	}

	/**
	 * Initialize the set of post IDs we've already seen
	 */
	private async initializePostIds() {
		try {
			if (this.currentApiKey && this.currentUserId) {
				postsClient.setAuth(this.currentApiKey, this.currentUserId);
			}
			const posts = await postsClient.getPage(0, this.currentTags);
			this.latestPostIds.clear();
			posts.forEach((post) => this.latestPostIds.add(post.id));
		} catch (_error) {
			// Silently fail - we'll try again on next interval
		}
	}

	/**
	 * Check for new posts and trigger callback if found
	 */
	private async checkForNewPosts() {
		if (!this.isEnabled || !this.callback) return;

		try {
			if (this.currentApiKey && this.currentUserId) {
				postsClient.setAuth(this.currentApiKey, this.currentUserId);
			}
			const posts = await postsClient.getPage(0, this.currentTags);

			// Find new posts that we haven't seen before
			const newPosts = posts.filter((post) => !this.latestPostIds.has(post.id));

			if (newPosts.length > 0) {
				// Update our known post IDs
				posts.forEach((post) => this.latestPostIds.add(post.id));

				// Trigger callback with new posts
				this.callback(newPosts.length, newPosts);
			}
		} catch (_error) {
			// Silently fail - we'll try again on next interval
		}
	}

	/**
	 * Check if the service is currently running
	 */
	isRunning(): boolean {
		return this.isEnabled && this.intervalId !== null;
	}

	/**
	 * Get current search parameters
	 */
	getCurrentSearch() {
		return {
			tags: this.currentTags,
			apiKey: this.currentApiKey,
			userId: this.currentUserId
		};
	}
}

// Singleton instance
export const backgroundRefreshService = new BackgroundRefreshService();
