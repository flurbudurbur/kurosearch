import type { ClientMessage } from '../../src/types/websocket.js';

export const mockPingMessage: ClientMessage = {
	type: 'ping'
};

export const mockSubscribeMessage: ClientMessage = {
	type: 'subscribe',
	channels: ['live-posts', 'sync-notifications']
};

export const mockUnsubscribeMessage: ClientMessage = {
	type: 'unsubscribe',
	channels: ['live-posts']
};

export const mockSubscribeSyncCodeMessage: ClientMessage = {
	type: 'subscribe-sync-code',
	code: '123456'
};

export const mockApiRequestPostsMessage: ClientMessage = {
	type: 'api-request',
	endpoint: 'posts',
	params: {
		tags: 'test',
		limit: '10'
	}
};

export const mockApiRequestCommentsMessage: ClientMessage = {
	type: 'api-request',
	endpoint: 'comments',
	params: {
		post_id: '123456'
	}
};

export const mockApiRequestTagsMessage: ClientMessage = {
	type: 'api-request',
	endpoint: 'tags',
	params: {
		autocomplete: 'true',
		q: 'test'
	}
};

export const mockInvalidMessage = {
	invalid: 'message'
};

export const mockInvalidSyncCode: ClientMessage = {
	type: 'subscribe-sync-code',
	code: 'abc' // Invalid: not 6 digits
};

export const mockInvalidChannels: ClientMessage = {
	type: 'subscribe',
	channels: ['invalid-channel', 'live-posts']
};
