/**
 * WebSocket Module Exports
 * Central export point for all WebSocket-related functionality
 */

// Client
export { getWebSocketClient, initWebSocketClient, resetWebSocketClient } from './client';

// Store - Stores (readable state)
export {
	connectionState,
	lastNewPost,
	lastSyncNotification,
	lastCacheInvalidation,
	lastError,
	newPosts,
	syncNotifications,
	cacheInvalidations,
	isConnected,
	isConnecting,
	isDisconnected,
	hasError,
	lastMessage,
	subscribedChannels
} from './store';

// Store - Actions (functions to control WebSocket)
export {
	connect,
	disconnect,
	subscribe,
	unsubscribe,
	subscribeSyncCode,
	unsubscribeSyncCode,
	clearHistory,
	destroy,
	useWebSocket,
	useSyncCode
} from './store';

// Types
export type {
	Channel,
	ClientMessage,
	ServerMessage,
	NewPostData,
	SyncNotificationData,
	CacheInvalidationData,
	ConnectionState,
	MessageListener,
	StateChangeListener,
	WebSocketConfig
} from '$lib/types/websocket';
