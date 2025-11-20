import { addIndexedPosts, addIndexedPost, getIndexedPost } from '$lib/indexeddb/idb';
import { replaceHtmlEntities } from '$lib/logic/replace-html-entities';
import { getTagTypePriority } from '$lib/logic/tag-type-data';
import { parseXml } from '$lib/logic/parse-utils';
import { initWebSocketClient } from '$lib/websocket/client';

export const PAGE_SIZE = 100;
const API_ENDPOINT = '/api/posts';

// WebSocket client will handle request cancellation via request IDs
// No need for AbortController with WebSocket

const isTestEnv = typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'test';
const isDebugMode = () => {
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	return params.has('debug');
};

export const getPage = async (
	pageNumber: number,
	tags: string,
	apiKey: string = '',
	userId: string = '',
	pageSize: number = PAGE_SIZE
) => {
	try {
		const ws = initWebSocketClient();

		// Build params for WebSocket request
		const params: Record<string, string> = {
			fields: 'tag_info',
			limit: pageSize.toString(),
			pid: pageNumber.toString()
		};

		if (tags) {
			params.tags = tags;
		}

		if (userId && apiKey) {
			params.api_key = apiKey;
			params.user_id = userId;
		}

		// Send WebSocket request
		const responseText = await ws.request<string>('posts', params);

		// Parse JSON response
		let data = JSON.parse(responseText);

		// sometimes api returns placeholders that cause lots of null issues
		data = data.filter((x: r34.Post) => x.change);

		const posts = data.map(parsePost) as kurosearch.Post[];

		addIndexedPosts(posts);

		return posts;
	} catch (error) {
		if (!isTestEnv && isDebugMode()) console.warn('Failed to get posts', error);
		return [];
	}
};

export const getCount = async (tags: string, apiKey: string = '', userId: string = '') => {
	try {
		const ws = initWebSocketClient();

		// Build params for WebSocket request
		const params: Record<string, string> = {
			limit: '0'
		};

		if (tags) {
			params.tags = tags;
		}

		if (userId && apiKey) {
			params.api_key = apiKey;
			params.user_id = userId;
		}

		// Send WebSocket request
		const responseText = await ws.request<string>('posts', params);

		// Parse XML response
		const xml = parseXml(responseText);
		const count = Number(xml.getElementsByTagName('posts')[0].getAttribute('count'));

		throwOnInvalidCount(count);

		return count;
	} catch (error) {
		if (!isTestEnv && isDebugMode()) console.warn('Failed to get count', error);
		return 0;
	}
};

export const getPost = async (id: number, apiKey: string = '', userId: string = '') => {
	const indexedPost = await getIndexedPost(id);
	if (indexedPost !== undefined) {
		return indexedPost;
	}

	const ws = initWebSocketClient();

	// Build params for WebSocket request
	const params: Record<string, string> = {
		fields: 'tag_info',
		id: id.toString()
	};

	if (userId && apiKey) {
		params.api_key = apiKey;
		params.user_id = userId;
	}

	// Send WebSocket request
	const responseText = await ws.request<string>('posts', params);

	// Parse JSON response
	const data = JSON.parse(responseText);
	const post = parsePost(data[0]);

	addIndexedPost(post);

	return post;
};

const parsePost = (post: r34.Post): kurosearch.Post => {
	const height = post.height;
	const score = post.score;
	const preview_url = post.preview_url;
	const file_url = post.file_url;
	const parent_id = post.parent_id;
	const sample_url = post.sample_url;
	const sample_width = post.sample_width;
	const sample_height = post.sample_height;
	const rating = post.rating;
	const tagInfo = post.tag_info;
	const tags = post.tags;
	const id = post.id;
	const width = post.width;
	const change = post.change;
	const comment_count = post.comment_count;
	const status = post.status;
	const source = post.source;

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
		tags: tagInfo ? parseTagInfo(tagInfo) : parseSimpleTags(tags),
		width: Number(width),
		type: parsePostType(file_url)
	};
};

const parseTagInfo = (tagInfo: r34.Tag[]): kurosearch.Tag[] => {
	return tagInfo.map(parseTag).sort(byDescendingPriority);
};

const parseSimpleTags = (tags: string): kurosearch.Tag[] => {
	return tags.split(' ').map(parseSimpleTag);
};

const parseTag = ({ tag, count, type }: r34.Tag): kurosearch.Tag => ({
	name: replaceHtmlEntities(tag),
	count,
	type
});

const parseSimpleTag = (name: string): kurosearch.Tag => ({
	name: replaceHtmlEntities(name),
	count: 0,
	type: 'ambiguous'
});

const byDescendingPriority = (a: kurosearch.Tag, b: kurosearch.Tag) =>
	getTagTypePriority(a.type) - getTagTypePriority(b.type);

export const getPostsUrl = (
	pageNumber: number,
	serializedTags: string,
	apiKey: string = '',
	userId: string = '',
	pageSize: number = PAGE_SIZE
) => {
	const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || '';
	const base = new URL(
		API_ENDPOINT,
		backendUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')
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
};

export const getCountUrl = (serializedTags: string, apiKey: string, userId: string) => {
	const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || '';
	const base = new URL(
		API_ENDPOINT,
		backendUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')
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
};

const throwOnInvalidCount = (count: unknown) => {
	if (!Number.isFinite(count as number)) {
		throw new Error('Unexpected response received in getPage');
	}
};

const parsePostType = (file_url: string): kurosearch.PostType => {
	return file_url.endsWith('.webm') || file_url.endsWith('.mp4')
		? 'video'
		: file_url.includes('.gif')
			? 'gif'
			: 'image';
};
