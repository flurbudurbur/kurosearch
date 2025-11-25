/**
 * API Client Factory
 * Provides singleton instances of API clients
 */

import { PostsClient, PAGE_SIZE } from './PostsClient';
import { CommentsClient } from './CommentsClient';
import { TagsClient } from './TagsClient';

// Export client classes for direct instantiation if needed
export { PostsClient, CommentsClient, TagsClient, PAGE_SIZE };
export { ApiClient } from './ApiClient';
export type { AuthContext, RequestOptions } from './ApiClient';
export type { Comment } from './CommentsClient';

// Singleton client instances
let postsClientInstance: PostsClient | null = null;
let commentsClientInstance: CommentsClient | null = null;
let tagsClientInstance: TagsClient | null = null;

/**
 * Get or create the Posts API client singleton
 */
export function getPostsClient(): PostsClient {
	if (!postsClientInstance) {
		postsClientInstance = new PostsClient();
	}
	return postsClientInstance;
}

/**
 * Get or create the Comments API client singleton
 */
export function getCommentsClient(): CommentsClient {
	if (!commentsClientInstance) {
		commentsClientInstance = new CommentsClient();
	}
	return commentsClientInstance;
}

/**
 * Get or create the Tags API client singleton
 */
export function getTagsClient(): TagsClient {
	if (!tagsClientInstance) {
		tagsClientInstance = new TagsClient();
	}
	return tagsClientInstance;
}

/**
 * Set authentication for all API clients
 */
export function setGlobalAuth(apiKey: string, userId: string): void {
	getPostsClient().setAuth(apiKey, userId);
	getCommentsClient().setAuth(apiKey, userId);
	getTagsClient().setAuth(apiKey, userId);
}

/**
 * Clear authentication from all API clients
 */
export function clearGlobalAuth(): void {
	getPostsClient().clearAuth();
	getCommentsClient().clearAuth();
	getTagsClient().clearAuth();
}

/**
 * Reset all client instances (primarily for testing)
 */
export function resetAllClients(): void {
	postsClientInstance = null;
	commentsClientInstance = null;
	tagsClientInstance = null;
}

// Convenience exports for singleton instances
export const postsClient = getPostsClient();
export const commentsClient = getCommentsClient();
export const tagsClient = getTagsClient();
