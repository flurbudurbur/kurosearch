import { addIndexedComments, getIndexedComments } from '$lib/indexeddb/idb';
import { parseXml } from '$lib/logic/parse-utils';
import { initWebSocketClient } from '$lib/websocket/client';

export type Comment = {
	author: string;
	createdAt: string;
	content: string;
};

// Request deduplication cache: Maps postId to in-flight request Promise
const inflightRequests = new Map<number, Promise<Comment[]>>();

export const getComments = async (postId: number, apiKey: string = '', userId: string = '') => {
	if (typeof postId !== 'number') {
		throw new TypeError('Invalid postId');
	}

	// Check IndexedDB cache first
	const indexedComments = await getIndexedComments(postId);
	if (indexedComments !== undefined) {
		return indexedComments;
	}

	// Check if there's already an in-flight request for this post
	const existingRequest = inflightRequests.get(postId);
	if (existingRequest) {
		return existingRequest;
	}

	// Create and cache the request promise
	const requestPromise = (async () => {
		try {
			const ws = initWebSocketClient();

			// Build params for WebSocket request
			const params: Record<string, string> = {
				post_id: String(postId)
			};

			if (userId && apiKey) {
				params.api_key = apiKey;
				params.user_id = userId;
			}

			// Send WebSocket request
			const responseText = await ws.request<string>('comments', params);

			// Parse XML response
			const xml = parseXml(responseText);

			const comments: Comment[] = [];
			for (const comment of xml.getElementsByTagName('comment')) {
				comments.push(parseComment(comment.attributes));
			}
			addIndexedComments(postId, comments);

			return comments;
		} finally {
			// Remove from inflight cache once complete (success or error)
			inflightRequests.delete(postId);
		}
	})();

	// Store the promise in the inflight cache
	inflightRequests.set(postId, requestPromise);

	return requestPromise;
};

const parseComment = (comment: NamedNodeMap): Comment => {
	const creator = comment.getNamedItem('creator');
	const createdAt = comment.getNamedItem('created_at');
	const body = comment.getNamedItem('body');

	if (creator == null || createdAt == null || body == null) {
		throw new Error(
			`Failed to parse comment, attribute was null. ${creator}, ${createdAt}, ${body}`
		);
	}

	return {
		author: creator.value,
		createdAt: createdAt.value,
		content: body.value
	};
};
