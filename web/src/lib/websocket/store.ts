/**
 * WebSocket Store
 * Reactive Svelte store for WebSocket connection state and messages
 * Matches the Fastify api implementation exactly
 */

import { browser } from '$app/environment';
import { writable, derived, type Readable } from 'svelte/store';
import { getWebSocketClient, initWebSocketClient } from './client';
import type {
	ServerMessage,
	ConnectionState,
	Channel,
	NewPostData,
	SyncNotificationData,
	CacheInvalidationData
} from '$lib/types/websocket';

/**
 * WebSocket Store State
 * Uses traditional Svelte stores for shared state
 */

// Connection state
export const connectionState = writable<ConnectionState>('disconnected');

// Last received messages by type
export const lastNewPost = writable<(ServerMessage & { type: 'new-post' }) | null>(null);
export const lastSyncNotification = writable<
	(ServerMessage & { type: 'sync-notification' }) | null
>(null);
export const lastCacheInvalidation = writable<
	(ServerMessage & { type: 'cache-invalidate' }) | null
>(null);
export const lastError = writable<(ServerMessage & { type: 'error' }) | null>(null);

// Message history (last 10 messages of each type)
export const newPosts = writable<NewPostData[]>([]);
export const syncNotifications = writable<SyncNotificationData[]>([]);
export const cacheInvalidations = writable<CacheInvalidationData[]>([]);

// Derived computed properties
export const isConnected: Readable<boolean> = derived(
	connectionState,
	($state) => $state === 'connected'
);
export const isConnecting: Readable<boolean> = derived(
	connectionState,
	($state) => $state === 'connecting'
);
export const isDisconnected: Readable<boolean> = derived(
	connectionState,
	($state) => $state === 'disconnected'
);
export const hasError: Readable<boolean> = derived(
	[connectionState, lastError],
	([$state, $lastError]) => $state === 'error' || $lastError !== null
);

// Last message (for demo purposes)
export const lastMessage: Readable<ServerMessage | null> = derived(
	[lastNewPost, lastSyncNotification, lastCacheInvalidation, lastError],
	([$lastNewPost, $lastSyncNotification, $lastCacheInvalidation, $lastError]) =>
		$lastNewPost || $lastSyncNotification || $lastCacheInvalidation || $lastError
);

// Subscribed channels (for demo purposes)
export const subscribedChannels = writable<Channel[]>([]);

// Private state for managing the WebSocket client
let initialized = false;
let client: ReturnType<typeof getWebSocketClient> | null = null;
let unsubscribeState: (() => void) | null = null;
let unsubscribeMessages: (() => void) | null = null;

/**
 * Initialize the WebSocket connection
 */
function init(): void {
	if (initialized) return;

	try {
		client = initWebSocketClient();
		initialized = true;

		// Subscribe to state changes
		unsubscribeState = client.onStateChange((state) => {
			console.log('[WS STORE DEBUG] State change received in store:', state);
			connectionState.set(state);
			console.log('[WS STORE DEBUG] connectionState store updated');
		});

		// Subscribe to messages
		unsubscribeMessages = client.onMessage((message) => {
			handleMessage(message);
		});
	} catch (error) {
		console.error('[WebSocket Store] Failed to initialize:', error);
	}
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(message: ServerMessage): void {
	switch (message.type) {
		case 'new-post':
			lastNewPost.set(message);
			newPosts.update((posts) => [message.data, ...posts].slice(0, 10));
			break;

		case 'sync-notification':
			lastSyncNotification.set(message);
			syncNotifications.update((notifications) => [message.data, ...notifications].slice(0, 10));
			break;

		case 'cache-invalidate':
			lastCacheInvalidation.set(message);
			cacheInvalidations.update((invalidations) => [message.data, ...invalidations].slice(0, 10));
			break;

		case 'error':
			lastError.set(message);
			console.error('[WebSocket Store] Server error:', message.data.message, message.data.code);
			break;

		case 'pong':
			// Heartbeat response - no action needed
			break;

		case 'subscribed':
			// Subscription confirmation - no action needed
			break;

		case 'unsubscribed':
			// Unsubscription confirmation - no action needed
			break;
	}
}

/**
 * WebSocket Actions
 * Functions to interact with the WebSocket connection
 */

/**
 * Connect to WebSocket server
 */
export function connect(): void {
	init();
	client?.connect();
}

/**
 * Disconnect from WebSocket server
 */
export function disconnect(): void {
	client?.disconnect();
}

/**
 * Subscribe to channels
 */
export function subscribe(channels: Channel[]): void {
	init();
	client?.subscribe(channels);
	// Track subscribed channels
	subscribedChannels.update((current) => {
		const updated = [...current];
		channels.forEach((channel) => {
			if (!updated.includes(channel)) {
				updated.push(channel);
			}
		});
		return updated;
	});
}

/**
 * Unsubscribe from channels
 */
export function unsubscribe(channels: Channel[]): void {
	client?.unsubscribe(channels);
	// Update subscribed channels
	subscribedChannels.update((current) => current.filter((ch) => !channels.includes(ch)));
}

/**
 * Subscribe to sync code notifications
 */
export function subscribeSyncCode(code: string): void {
	init();
	client?.subscribeSyncCode(code);
}

/**
 * Unsubscribe from sync code notifications
 */
export function unsubscribeSyncCode(): void {
	client?.unsubscribeSyncCode();
}

/**
 * Clear message history
 */
export function clearHistory(): void {
	newPosts.set([]);
	syncNotifications.set([]);
	cacheInvalidations.set([]);
	lastNewPost.set(null);
	lastSyncNotification.set(null);
	lastCacheInvalidation.set(null);
	lastError.set(null);
}

/**
 * Cleanup on destroy
 */
export function destroy(): void {
	unsubscribeState?.();
	unsubscribeMessages?.();
	client?.disconnect();
	initialized = false;
	client = null;
}

/**
 * Reset reconnection attempts and immediately attempt to connect
 * Useful for manual reconnect buttons after connection failures
 */
export function resetAndReconnect(): void {
	init();
	client?.resetAndReconnect();
}

/**
 * Hook for subscribing to WebSocket channels
 * Auto-subscribes on mount and unsubscribes on unmount
 */
export function useWebSocket(channels: Channel[]) {
	// Connect and subscribe
	connect();
	subscribe(channels);

	return {
		unsubscribe: () => {
			unsubscribe(channels);
		}
	};
}

/**
 * Hook for subscribing to sync code notifications
 * Auto-subscribes on mount and unsubscribes on unmount
 */
export function useSyncCode(code: string) {
	// Connect and subscribe to sync code
	connect();
	subscribeSyncCode(code);

	return {
		unsubscribe: () => {
			unsubscribeSyncCode();
		}
	};
}

/**
 * Auto-initialize WebSocket connection when module is imported in browser
 * Uses queueMicrotask to defer until environment is ready
 */
if (browser) {
	queueMicrotask(() => {
		init();
	});
}
