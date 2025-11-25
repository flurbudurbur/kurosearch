/**
 * WebSocket Event Types and Schemas
 * Defines the protocol for client-server WebSocket communication
 */

/**
 * Channel names for pub/sub
 */
export type Channel = 'live-posts' | 'sync-notifications' | 'cache-invalidation';

/**
 * API Request types
 */
export type APIResource = 'posts' | 'comments' | 'tags';

/**
 * Client → Server Messages
 */
export type ClientMessage =
	| { type: 'ping' }
	| { type: 'subscribe'; channels: Channel[] }
	| { type: 'unsubscribe'; channels: Channel[] }
	| { type: 'subscribe-sync-code'; code: string }
	| { type: 'api-request'; id: string; resource: APIResource; params: Record<string, string> };

/**
 * Server → Client Messages
 */
export type ServerMessage =
	| { type: 'pong'; timestamp: number }
	| { type: 'subscribed'; channels: Channel[] }
	| { type: 'unsubscribed'; channels: Channel[] }
	| { type: 'new-post'; data: NewPostData }
	| { type: 'sync-notification'; data: SyncNotificationData }
	| { type: 'cache-invalidate'; data: CacheInvalidationData }
	| { type: 'cache-write'; data: CacheWriteData }
	| { type: 'data-update'; data: DataUpdateData }
	| { type: 'error'; data: ErrorData }
	| { type: 'api-response'; id: string; success: boolean; data?: unknown; error?: string }
	| { type: 'api-error'; id: string; error: string; code?: string };

/**
 * New post notification data
 */
export interface NewPostData {
	id: number;
	tags: string[];
	preview_url: string;
	sample_url: string;
	file_url: string;
	rating: string;
	score: number;
	timestamp: number;
}

/**
 * Sync notification data
 */
export interface SyncNotificationData {
	code: string;
	consumed: boolean;
	timestamp: number;
}

/**
 * Cache invalidation data
 */
export interface CacheInvalidationData {
	pattern: string;
	reason?: string;
	timestamp: number;
}

/**
 * Cache write data - broadcasted when data is written to cache
 */
export interface CacheWriteData {
	key: string;
	resource: 'posts' | 'comments' | 'tags';
	timestamp: number;
}

/**
 * Data update data - broadcasted when underlying data changes
 */
export interface DataUpdateData {
	resource: 'posts' | 'comments' | 'tags';
	action: 'created' | 'updated' | 'deleted';
	affectedKeys?: string[];
	timestamp: number;
}

/**
 * Error data - broadcasted when API errors occur
 */
export interface ErrorData {
	message: string;
	code?: string;
	resource?: 'posts' | 'comments' | 'tags' | 'sync';
	timestamp: number;
}

/**
 * Type guards for runtime validation
 */
export function isClientMessage(data: unknown): data is ClientMessage {
	if (typeof data !== 'object' || data === null) return false;
	const msg = data as { type?: string };
	return (
		typeof msg.type === 'string' &&
		['ping', 'subscribe', 'unsubscribe', 'subscribe-sync-code', 'api-request'].includes(msg.type)
	);
}

export function isValidChannel(channel: string): channel is Channel {
	return ['live-posts', 'sync-notifications', 'cache-invalidation'].includes(channel);
}
