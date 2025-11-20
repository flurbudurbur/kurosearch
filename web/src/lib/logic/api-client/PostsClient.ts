import { ApiClient } from './ApiClient';
import { replaceHtmlEntities } from '$lib/logic/replace-html-entities';
import { getTagTypePriority } from '$lib/logic/tag-type-data';
import { parseXml } from '$lib/logic/parse-utils';

export const PAGE_SIZE = 100;

/**
 * Posts API Client
 * Handles fetching and parsing posts from the Rule34 API
 */
export class PostsClient extends ApiClient {
	/**
	 * Get a page of posts
	 */
	async getPage(
		pageNumber: number,
		tags: string = '',
		pageSize: number = PAGE_SIZE
	): Promise<kurosearch.Post[]> {
		try {
			const params = this.buildParams({
				fields: 'tag_info',
				limit: pageSize.toString(),
				pid: pageNumber.toString(),
				...(tags && { tags })
			});

			const responseText = await this.request<string>('posts', params);
			let data = this.parseJSON<r34.Post[]>(responseText);

			// Filter out placeholder posts that cause null issues
			data = data.filter((x) => x.change);

			const posts = data.map(this.parsePost);

			// Cache posts in IndexedDB
			const idb = await this.getIndexedDB();
			if (idb) {
				await idb.addIndexedPosts(posts);
			}

			return posts;
		} catch (error) {
			if (!this.isTestEnv() && this.isDebugMode()) {
				console.warn('[PostsClient] Failed to get posts page', error);
			}
			return [];
		}
	}

	/**
	 * Get count of posts matching search criteria
	 */
	async getCount(tags: string = ''): Promise<number> {
		try {
			const params = this.buildParams({
				limit: '0',
				...(tags && { tags })
			});

			const responseText = await this.request<string>('posts', params);
			const xml = parseXml(responseText);
			const count = Number(xml.getElementsByTagName('posts')[0].getAttribute('count'));

			this.throwOnInvalidCount(count);

			return count;
		} catch (error) {
			if (!this.isTestEnv() && this.isDebugMode()) {
				console.warn('[PostsClient] Failed to get post count', error);
			}
			return 0;
		}
	}

	/**
	 * Get a single post by ID
	 * Checks IndexedDB cache first
	 */
	async getPost(id: number): Promise<kurosearch.Post | undefined> {
		// Check IndexedDB cache first
		const idb = await this.getIndexedDB();
		if (idb) {
			const indexedPost = await idb.getIndexedPost(id);
			if (indexedPost !== undefined) {
				return indexedPost;
			}
		}

		const params = this.buildParams({
			fields: 'tag_info',
			id: id.toString()
		});

		const responseText = await this.request<string>('posts', params);
		const data = this.parseJSON<r34.Post[]>(responseText);
		const post = this.parsePost(data[0]);

		// Cache post in IndexedDB
		if (idb) {
			await idb.addIndexedPost(post);
		}

		return post;
	}

	/**
	 * Parse a single post from API response
	 */
	private parsePost = (post: r34.Post): kurosearch.Post => {
		const {
			height,
			score,
			preview_url,
			file_url,
			parent_id,
			sample_url,
			sample_width,
			sample_height,
			rating,
			tag_info: tagInfo,
			tags,
			id,
			width,
			change,
			comment_count,
			status,
			source
		} = post;

		return {
			preview_url,
			sample_url,
			file_url,
			comment_count: Number(comment_count),
			height: Number(height),
			id: Number(id),
			change: Number(change) * 1000,
			parent_id: parent_id ? Number(parent_id) : undefined,
			rating: rating as kurosearch.Rating,
			sample_height: Number(sample_height),
			sample_width: Number(sample_width),
			score: Number(score),
			source,
			status,
			tags: tagInfo ? this.parseTagInfo(tagInfo) : this.parseSimpleTags(tags),
			width: Number(width),
			type: this.parsePostType(file_url)
		};
	};

	/**
	 * Parse tag info array from API
	 */
	private parseTagInfo(tagInfo: r34.Tag[]): kurosearch.Tag[] {
		return tagInfo.map(this.parseTag).sort(this.byDescendingPriority);
	}

	/**
	 * Parse simple tags string from API
	 */
	private parseSimpleTags(tags: string): kurosearch.Tag[] {
		return tags.split(' ').map(this.parseSimpleTag);
	}

	/**
	 * Parse a single tag from tag info
	 */
	private parseTag = ({ tag, count, type }: r34.Tag): kurosearch.Tag => ({
		name: replaceHtmlEntities(tag),
		count,
		type
	});

	/**
	 * Parse a simple tag (name only)
	 */
	private parseSimpleTag = (name: string): kurosearch.Tag => ({
		name: replaceHtmlEntities(name),
		count: 0,
		type: 'ambiguous'
	});

	/**
	 * Sort tags by priority (descending)
	 */
	private byDescendingPriority = (a: kurosearch.Tag, b: kurosearch.Tag) =>
		getTagTypePriority(a.type) - getTagTypePriority(b.type);

	/**
	 * Determine post type from file URL
	 */
	private parsePostType(file_url: string): kurosearch.PostType {
		return file_url.endsWith('.webm') || file_url.endsWith('.mp4')
			? 'video'
			: file_url.includes('.gif')
				? 'gif'
				: 'image';
	}

	/**
	 * Validate count response
	 */
	private throwOnInvalidCount(count: unknown): void {
		if (!Number.isFinite(count as number)) {
			throw new Error('Unexpected response received in getCount');
		}
	}

	/**
	 * Build URL for posts API endpoint (for non-WebSocket use)
	 * @deprecated Use WebSocket methods instead
	 */
	getPostsUrl(
		pageNumber: number,
		serializedTags: string,
		apiKey: string = '',
		userId: string = '',
		pageSize: number = PAGE_SIZE
	): string {
		const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || '';
		const base = new URL(
			'/api/posts',
			backendUrl ||
				(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')
		);

		base.searchParams.set('fields', 'tag_info');
		base.searchParams.set('limit', pageSize.toString());
		base.searchParams.set('pid', pageNumber.toString());

		if (userId && apiKey) {
			base.searchParams.set('api_key', apiKey);
			base.searchParams.set('user_id', userId);
		}

		if (serializedTags) {
			base.searchParams.set('tags', serializedTags);
		}

		return base.toString();
	}

	/**
	 * Build URL for count API endpoint (for non-WebSocket use)
	 * @deprecated Use WebSocket methods instead
	 */
	getCountUrl(serializedTags: string, apiKey: string, userId: string): string {
		const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || '';
		const base = new URL(
			'/api/posts',
			backendUrl ||
				(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')
		);

		base.searchParams.set('limit', '0');

		if (userId && apiKey) {
			base.searchParams.set('api_key', apiKey);
			base.searchParams.set('user_id', userId);
		}

		if (serializedTags) {
			base.searchParams.set('tags', serializedTags);
		}

		return base.toString();
	}
}
