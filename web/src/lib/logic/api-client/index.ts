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

// Backward-compatible function exports (wrap client methods)
// These maintain the same API as the old functional approach

/**
 * @deprecated Use postsClient.getPage() instead
 */
export const getPage = (
	pageNumber: number,
	tags: string,
	apiKey: string = '',
	userId: string = '',
	pageSize: number = PAGE_SIZE
) => {
	const client = getPostsClient();
	if (apiKey && userId) {
		client.setAuth(apiKey, userId);
	}
	return client.getPage(pageNumber, tags, pageSize);
};

/**
 * @deprecated Use postsClient.getCount() instead
 */
export const getCount = (tags: string, apiKey: string = '', userId: string = '') => {
	const client = getPostsClient();
	if (apiKey && userId) {
		client.setAuth(apiKey, userId);
	}
	return client.getCount(tags);
};

/**
 * @deprecated Use postsClient.getPost() instead
 */
export const getPost = (id: number, apiKey: string = '', userId: string = '') => {
	const client = getPostsClient();
	if (apiKey && userId) {
		client.setAuth(apiKey, userId);
	}
	return client.getPost(id);
};

/**
 * @deprecated Use postsClient.getPostsUrl() instead
 */
export const getPostsUrl = (
	pageNumber: number,
	serializedTags: string,
	apiKey: string = '',
	userId: string = '',
	pageSize: number = PAGE_SIZE
) => {
	return getPostsClient().getPostsUrl(pageNumber, serializedTags, apiKey, userId, pageSize);
};

/**
 * @deprecated Use postsClient.getCountUrl() instead
 */
export const getCountUrl = (serializedTags: string, apiKey: string, userId: string) => {
	return getPostsClient().getCountUrl(serializedTags, apiKey, userId);
};

/**
 * @deprecated Use commentsClient.getComments() instead
 */
export const getComments = (postId: number, apiKey: string = '', userId: string = '') => {
	const client = getCommentsClient();
	if (apiKey && userId) {
		client.setAuth(apiKey, userId);
	}
	return client.getComments(postId);
};

/**
 * @deprecated Use tagsClient.getTagSuggestions() instead
 */
export const getTagSuggestions = (term: string) => {
	return getTagsClient().getTagSuggestions(term);
};

/**
 * @deprecated Use tagsClient.getTagDetails() instead
 */
export const getTagDetails = (name: string, apiKey: string, userId: string) => {
	const client = getTagsClient();
	if (apiKey && userId) {
		client.setAuth(apiKey, userId);
	}
	return client.getTagDetails(name);
};
