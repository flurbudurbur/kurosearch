import type { WebSocket } from 'ws';
import type { Channel, ServerMessage } from '../types/websocket.js';
import { randomUUID } from 'crypto';
import { getEventBus } from './event-bus.js';
import type { Logger } from 'pino';

/**
 * Connection information
 */
interface Connection {
	id: string;
	socket: WebSocket;
	subscriptions: Set<Channel>;
	syncCodes: Set<string>; // Sync codes this connection is waiting for
	createdAt: Date;
}

/**
 * WebSocket Connection Manager
 * Manages all active WebSocket connections and subscriptions
 */
export class ConnectionManager {
	private connections: Map<string, Connection> = new Map();
	private channelSubscribers: Map<Channel, Set<string>> = new Map();
	private syncCodeSubscribers: Map<string, Set<string>> = new Map();
	private logger?: Logger;

	constructor(logger?: Logger) {
		this.logger = logger;

		// Initialize channel maps
		const channels: Channel[] = ['live-posts', 'sync-notifications', 'cache-invalidation'];
		channels.forEach((channel) => {
			this.channelSubscribers.set(channel, new Set());
		});

		// Subscribe to cache events from the event bus
		this.initializeEventListeners();
	}

	/**
	 * Initialize event bus listeners for cache events
	 * Broadcasts cache events to WebSocket clients subscribed to cache-invalidation channel
	 */
	private initializeEventListeners(): void {
		const eventBus = getEventBus(this.logger);

		// Listen for cache writes
		eventBus.on('cache:write', (payload) => {
			// Extract resource from cache key (e.g., "posts:page:1" -> "posts")
			const resource = payload.key.split(':')[0] as 'posts' | 'comments' | 'tags';

			this.broadcast('cache-invalidation', {
				type: 'cache-write',
				data: {
					key: payload.key,
					resource,
					timestamp: Date.now()
				}
			});
			this.logger?.debug({ key: payload.key }, '[ConnectionManager] Broadcasted cache-write event');
		});

		// Listen for cache invalidations
		eventBus.on('cache:invalidate', (payload) => {
			this.broadcast('cache-invalidation', {
				type: 'cache-invalidate',
				data: {
					pattern: payload.pattern,
					reason: payload.count ? `Invalidated ${payload.count} keys` : 'cache invalidation',
					timestamp: Date.now()
				}
			});
			this.logger?.debug(
				{ pattern: payload.pattern, count: payload.count },
				'[ConnectionManager] Broadcasted cache-invalidate event'
			);
		});

		// Listen for cache clears - treat as a pattern-based invalidation
		eventBus.on('cache:clear', (payload) => {
			this.broadcast('cache-invalidation', {
				type: 'cache-invalidate',
				data: {
					pattern: payload.prefix || '*',
					reason: 'cache cleared',
					timestamp: Date.now()
				}
			});
			this.logger?.debug(
				{ prefix: payload.prefix },
				'[ConnectionManager] Broadcasted cache-clear event'
			);
		});

		this.logger?.info('[ConnectionManager] Event bus listeners initialized');
	}

	/**
	 * Add a new connection
	 */
	addConnection(socket: WebSocket): string {
		const id = randomUUID();
		const connection: Connection = {
			id,
			socket,
			subscriptions: new Set(),
			syncCodes: new Set(),
			createdAt: new Date()
		};

		this.connections.set(id, connection);

		// Set up close handler
		socket.on('close', () => {
			this.removeConnection(id);
		});

		return id;
	}

	/**
	 * Remove a connection and clean up subscriptions
	 */
	removeConnection(id: string): void {
		const connection = this.connections.get(id);
		if (!connection) return;

		// Clean up channel subscriptions
		connection.subscriptions.forEach((channel) => {
			const subscribers = this.channelSubscribers.get(channel);
			if (subscribers) {
				subscribers.delete(id);
			}
		});

		// Clean up sync code subscriptions
		connection.syncCodes.forEach((code) => {
			const subscribers = this.syncCodeSubscribers.get(code);
			if (subscribers) {
				subscribers.delete(id);
				// Remove empty sets
				if (subscribers.size === 0) {
					this.syncCodeSubscribers.delete(code);
				}
			}
		});

		this.connections.delete(id);
	}

	/**
	 * Subscribe a connection to channels
	 */
	subscribe(connectionId: string, channels: Channel[]): boolean {
		const connection = this.connections.get(connectionId);
		if (!connection) return false;

		channels.forEach((channel) => {
			connection.subscriptions.add(channel);
			const subscribers = this.channelSubscribers.get(channel);
			if (subscribers) {
				subscribers.add(connectionId);
			}
		});

		return true;
	}

	/**
	 * Unsubscribe a connection from channels
	 */
	unsubscribe(connectionId: string, channels: Channel[]): boolean {
		const connection = this.connections.get(connectionId);
		if (!connection) return false;

		channels.forEach((channel) => {
			connection.subscriptions.delete(channel);
			const subscribers = this.channelSubscribers.get(channel);
			if (subscribers) {
				subscribers.delete(connectionId);
			}
		});

		return true;
	}

	/**
	 * Subscribe to sync code notifications
	 */
	subscribeSyncCode(connectionId: string, code: string): boolean {
		const connection = this.connections.get(connectionId);
		if (!connection) return false;

		connection.syncCodes.add(code);

		if (!this.syncCodeSubscribers.has(code)) {
			this.syncCodeSubscribers.set(code, new Set());
		}
		this.syncCodeSubscribers.get(code)!.add(connectionId);

		return true;
	}

	/**
	 * Send message to a specific connection
	 */
	sendToConnection(connectionId: string, message: ServerMessage): boolean {
		const connection = this.connections.get(connectionId);
		if (!connection || connection.socket.readyState !== 1) {
			// 1 = OPEN
			return false;
		}

		try {
			connection.socket.send(JSON.stringify(message));
			return true;
		} catch (error) {
			console.error(`Failed to send message to connection ${connectionId}:`, error);
			return false;
		}
	}

	/**
	 * Broadcast message to all subscribers of a channel
	 */
	broadcast(channel: Channel, message: ServerMessage): number {
		const subscribers = this.channelSubscribers.get(channel);
		if (!subscribers) return 0;

		let sent = 0;
		subscribers.forEach((connectionId) => {
			if (this.sendToConnection(connectionId, message)) {
				sent++;
			}
		});

		return sent;
	}

	/**
	 * Send message to all connections subscribed to a sync code
	 */
	notifySyncCode(code: string, message: ServerMessage): number {
		const subscribers = this.syncCodeSubscribers.get(code);
		if (!subscribers) return 0;

		let sent = 0;
		subscribers.forEach((connectionId) => {
			if (this.sendToConnection(connectionId, message)) {
				sent++;
			}
		});

		// Clean up after notification
		this.syncCodeSubscribers.delete(code);

		return sent;
	}

	/**
	 * Get connection statistics
	 */
	getStats(): {
		totalConnections: number;
		channelSubscriptions: Record<Channel, number>;
		syncCodeSubscriptions: number;
	} {
		const channelSubscriptions: Record<string, number> = {};
		this.channelSubscribers.forEach((subscribers, channel) => {
			channelSubscriptions[channel] = subscribers.size;
		});

		return {
			totalConnections: this.connections.size,
			channelSubscriptions: channelSubscriptions as Record<Channel, number>,
			syncCodeSubscriptions: this.syncCodeSubscribers.size
		};
	}

	/**
	 * Get connection by ID
	 */
	getConnection(id: string): Connection | undefined {
		return this.connections.get(id);
	}
}

// Singleton instance
export const connectionManager = new ConnectionManager();
