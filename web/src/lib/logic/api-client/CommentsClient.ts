import { ApiClient } from './ApiClient';
import { parseXml } from '$lib/logic/parse-utils';

export interface Comment {
	author: string;
	createdAt: string;
	content: string;
}

/**
 * Comments API Client
 * Handles fetching and parsing comments for posts
 */
export class CommentsClient extends ApiClient {
	protected getClientName(): string {
		return 'CommentsClient';
	}

	/**
	 * Get comments for a specific post
	 * Checks IndexedDB cache first
	 *
	 * Note: The WebSocket client handles request deduplication automatically,
	 * so we don't need manual inflight request tracking
	 */
	async getComments(postId: number): Promise<Comment[]> {
		if (typeof postId !== 'number') {
			throw new TypeError('Invalid postId');
		}

		return this.withErrorHandling(
			async () => {
				return this.cachedRequest({
					cacheKey: postId,
					fetchFn: async () => {
						const params = this.buildParams({
							post_id: String(postId)
						});

						const responseText = await this.request<string>('comments', params);
						const xml = parseXml(responseText);

						const comments: Comment[] = [];
						for (const comment of xml.getElementsByTagName('comment')) {
							comments.push(this.parseComment(comment.attributes));
						}

						return comments;
					},
					getCached: (idb, key) => idb.getIndexedComments(key as number),
					setCached: async (idb, key, comments) => idb.addIndexedComments(key as number, comments)
				});
			},
			[],
			`Failed to get comments for post ${postId}`
		);
	}

	/**
	 * Parse a single comment from XML attributes
	 */
	private parseComment(comment: NamedNodeMap): Comment {
		const creator = comment.getNamedItem('creator');
		const createdAt = comment.getNamedItem('created_at');
		const body = comment.getNamedItem('body');

		if (creator == null || createdAt == null || body == null) {
			throw new Error(
				`Failed to parse comment, attribute was null. creator=${creator}, createdAt=${createdAt}, body=${body}`
			);
		}

		return {
			author: creator.value,
			createdAt: createdAt.value,
			content: body.value
		};
	}
}
