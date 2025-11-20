import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionManager } from '../../../src/websocket/manager.js';
import { createMockWebSocket } from '../../helpers/test-utils.js';
import type { Channel, ServerMessage } from '../../../src/websocket/events.js';

describe('ConnectionManager', () => {
	let manager: ConnectionManager;

	beforeEach(() => {
		manager = new ConnectionManager();
	});

	describe('addConnection', () => {
		it('should add a new connection and return ID', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
			expect(id.length).toBeGreaterThan(0);
		});

		it('should generate unique IDs for different connections', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();

			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			expect(id1).not.toBe(id2);
		});

		it('should initialize connection with empty subscriptions', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			const connection = manager.getConnection(id);
			expect(connection).toBeDefined();
			expect(connection!.subscriptions.size).toBe(0);
			expect(connection!.syncCodes.size).toBe(0);
		});

		it('should set up close handler on socket', () => {
			const socket = createMockWebSocket();
			manager.addConnection(socket as any);

			expect(socket.on).toHaveBeenCalledWith('close', expect.any(Function));
		});

		it('should store creation timestamp', () => {
			const socket = createMockWebSocket();
			const before = new Date();
			const id = manager.addConnection(socket as any);
			const after = new Date();

			const connection = manager.getConnection(id);
			expect(connection!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(connection!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('removeConnection', () => {
		it('should remove connection', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.removeConnection(id);

			expect(manager.getConnection(id)).toBeUndefined();
		});

		it('should clean up channel subscriptions', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.subscribe(id, ['live-posts', 'cache-invalidation']);
			manager.removeConnection(id);

			const stats = manager.getStats();
			expect(stats.channelSubscriptions['live-posts']).toBe(0);
			expect(stats.channelSubscriptions['cache-invalidation']).toBe(0);
		});

		it('should clean up sync code subscriptions', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.subscribeSyncCode(id, '123456');
			expect(manager.getStats().syncCodeSubscriptions).toBe(1);

			manager.removeConnection(id);
			expect(manager.getStats().syncCodeSubscriptions).toBe(0);
		});

		it('should handle removing non-existent connection', () => {
			expect(() => manager.removeConnection('nonexistent')).not.toThrow();
		});

		it('should trigger on socket close', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			// Get the close handler
			const closeHandler = (socket.on as any).mock.calls.find(
				(call: any) => call[0] === 'close'
			)[1];

			// Trigger close
			closeHandler();

			expect(manager.getConnection(id)).toBeUndefined();
		});
	});

	describe('subscribe', () => {
		it('should subscribe connection to single channel', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			const result = manager.subscribe(id, ['live-posts']);

			expect(result).toBe(true);
			const connection = manager.getConnection(id);
			expect(connection!.subscriptions.has('live-posts')).toBe(true);
		});

		it('should subscribe connection to multiple channels', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			const result = manager.subscribe(id, [
				'live-posts',
				'sync-notifications',
				'cache-invalidation'
			]);

			expect(result).toBe(true);
			const connection = manager.getConnection(id);
			expect(connection!.subscriptions.size).toBe(3);
			expect(connection!.subscriptions.has('live-posts')).toBe(true);
			expect(connection!.subscriptions.has('sync-notifications')).toBe(true);
			expect(connection!.subscriptions.has('cache-invalidation')).toBe(true);
		});

		it('should return false for non-existent connection', () => {
			const result = manager.subscribe('nonexistent', ['live-posts']);

			expect(result).toBe(false);
		});

		it('should update channel subscribers map', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();
			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribe(id1, ['live-posts']);
			manager.subscribe(id2, ['live-posts']);

			const stats = manager.getStats();
			expect(stats.channelSubscriptions['live-posts']).toBe(2);
		});

		it('should handle duplicate subscriptions', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.subscribe(id, ['live-posts']);
			manager.subscribe(id, ['live-posts']);

			const connection = manager.getConnection(id);
			expect(connection!.subscriptions.size).toBe(1);
		});
	});

	describe('unsubscribe', () => {
		it('should unsubscribe connection from channel', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.subscribe(id, ['live-posts', 'sync-notifications']);
			const result = manager.unsubscribe(id, ['live-posts']);

			expect(result).toBe(true);
			const connection = manager.getConnection(id);
			expect(connection!.subscriptions.has('live-posts')).toBe(false);
			expect(connection!.subscriptions.has('sync-notifications')).toBe(true);
		});

		it('should unsubscribe from multiple channels', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.subscribe(id, ['live-posts', 'sync-notifications', 'cache-invalidation']);
			manager.unsubscribe(id, ['live-posts', 'sync-notifications']);

			const connection = manager.getConnection(id);
			expect(connection!.subscriptions.size).toBe(1);
			expect(connection!.subscriptions.has('cache-invalidation')).toBe(true);
		});

		it('should return false for non-existent connection', () => {
			const result = manager.unsubscribe('nonexistent', ['live-posts']);

			expect(result).toBe(false);
		});

		it('should update channel subscribers map', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();
			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribe(id1, ['live-posts']);
			manager.subscribe(id2, ['live-posts']);
			manager.unsubscribe(id1, ['live-posts']);

			const stats = manager.getStats();
			expect(stats.channelSubscriptions['live-posts']).toBe(1);
		});

		it('should handle unsubscribing from channel not subscribed to', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			expect(() => manager.unsubscribe(id, ['live-posts'])).not.toThrow();
		});
	});

	describe('subscribeSyncCode', () => {
		it('should subscribe connection to sync code', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			const result = manager.subscribeSyncCode(id, '123456');

			expect(result).toBe(true);
			const connection = manager.getConnection(id);
			expect(connection!.syncCodes.has('123456')).toBe(true);
		});

		it('should subscribe to multiple sync codes', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.subscribeSyncCode(id, '123456');
			manager.subscribeSyncCode(id, '789012');

			const connection = manager.getConnection(id);
			expect(connection!.syncCodes.size).toBe(2);
		});

		it('should return false for non-existent connection', () => {
			const result = manager.subscribeSyncCode('nonexistent', '123456');

			expect(result).toBe(false);
		});

		it('should update sync code subscribers map', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();
			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribeSyncCode(id1, '123456');
			manager.subscribeSyncCode(id2, '123456');

			const stats = manager.getStats();
			expect(stats.syncCodeSubscriptions).toBe(1); // 1 unique code
		});
	});

	describe('sendToConnection', () => {
		it('should send message to connection', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			const message: ServerMessage = { type: 'pong' };
			const result = manager.sendToConnection(id, message);

			expect(result).toBe(true);
			expect(socket.send).toHaveBeenCalledWith(JSON.stringify(message));
		});

		it('should return false for non-existent connection', () => {
			const message: ServerMessage = { type: 'pong' };
			const result = manager.sendToConnection('nonexistent', message);

			expect(result).toBe(false);
		});

		it('should return false if socket not open', () => {
			const socket = createMockWebSocket();
			socket.readyState = 3; // CLOSED
			const id = manager.addConnection(socket as any);

			const message: ServerMessage = { type: 'pong' };
			const result = manager.sendToConnection(id, message);

			expect(result).toBe(false);
			expect(socket.send).not.toHaveBeenCalled();
		});

		it('should handle send errors gracefully', () => {
			const socket = createMockWebSocket();
			socket.send.mockImplementationOnce(() => {
				throw new Error('Send failed');
			});
			const id = manager.addConnection(socket as any);

			const message: ServerMessage = { type: 'pong' };
			const result = manager.sendToConnection(id, message);

			expect(result).toBe(false);
		});

		it('should serialize complex messages', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			const message: ServerMessage = {
				type: 'api-response',
				requestId: '123',
				data: { nested: { value: 'test' } }
			};
			manager.sendToConnection(id, message);

			expect(socket.send).toHaveBeenCalledWith(JSON.stringify(message));
		});
	});

	describe('broadcast', () => {
		it('should broadcast to all subscribers', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();
			const socket3 = createMockWebSocket();

			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);
			const id3 = manager.addConnection(socket3 as any);

			manager.subscribe(id1, ['live-posts']);
			manager.subscribe(id2, ['live-posts']);
			// id3 not subscribed

			const message: ServerMessage = { type: 'new-post', data: { id: 123 } };
			const sent = manager.broadcast('live-posts', message);

			expect(sent).toBe(2);
			expect(socket1.send).toHaveBeenCalled();
			expect(socket2.send).toHaveBeenCalled();
			expect(socket3.send).not.toHaveBeenCalled();
		});

		it('should return 0 for channel with no subscribers', () => {
			const message: ServerMessage = { type: 'pong' };
			const sent = manager.broadcast('live-posts', message);

			expect(sent).toBe(0);
		});

		it('should skip closed connections', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();
			socket2.readyState = 3; // CLOSED

			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribe(id1, ['live-posts']);
			manager.subscribe(id2, ['live-posts']);

			const message: ServerMessage = { type: 'new-post', data: {} };
			const sent = manager.broadcast('live-posts', message);

			expect(sent).toBe(1);
			expect(socket1.send).toHaveBeenCalled();
			expect(socket2.send).not.toHaveBeenCalled();
		});

		it('should broadcast to different channels independently', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();

			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribe(id1, ['live-posts']);
			manager.subscribe(id2, ['cache-invalidation']);

			const message1: ServerMessage = { type: 'new-post', data: {} };
			const sent1 = manager.broadcast('live-posts', message1);

			const message2: ServerMessage = { type: 'cache-invalidate', data: {} };
			const sent2 = manager.broadcast('cache-invalidation', message2);

			expect(sent1).toBe(1);
			expect(sent2).toBe(1);
		});
	});

	describe('notifySyncCode', () => {
		it('should notify all subscribers of sync code', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();

			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribeSyncCode(id1, '123456');
			manager.subscribeSyncCode(id2, '123456');

			const message: ServerMessage = { type: 'sync-consumed', data: { code: '123456' } };
			const sent = manager.notifySyncCode('123456', message);

			expect(sent).toBe(2);
			expect(socket1.send).toHaveBeenCalled();
			expect(socket2.send).toHaveBeenCalled();
		});

		it('should clean up after notification (one-time use)', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			manager.subscribeSyncCode(id, '123456');

			const message: ServerMessage = { type: 'sync-consumed', data: {} };
			manager.notifySyncCode('123456', message);

			const stats = manager.getStats();
			expect(stats.syncCodeSubscriptions).toBe(0);
		});

		it('should return 0 for code with no subscribers', () => {
			const message: ServerMessage = { type: 'sync-consumed', data: {} };
			const sent = manager.notifySyncCode('999999', message);

			expect(sent).toBe(0);
		});

		it('should not notify other sync codes', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();

			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribeSyncCode(id1, '123456');
			manager.subscribeSyncCode(id2, '789012');

			const message: ServerMessage = { type: 'sync-consumed', data: {} };
			const sent = manager.notifySyncCode('123456', message);

			expect(sent).toBe(1);
			expect(socket1.send).toHaveBeenCalled();
			expect(socket2.send).not.toHaveBeenCalled();
		});
	});

	describe('getStats', () => {
		it('should return correct statistics', () => {
			const socket1 = createMockWebSocket();
			const socket2 = createMockWebSocket();

			const id1 = manager.addConnection(socket1 as any);
			const id2 = manager.addConnection(socket2 as any);

			manager.subscribe(id1, ['live-posts', 'cache-invalidation']);
			manager.subscribe(id2, ['live-posts']);
			manager.subscribeSyncCode(id1, '123456');

			const stats = manager.getStats();

			expect(stats.totalConnections).toBe(2);
			expect(stats.channelSubscriptions['live-posts']).toBe(2);
			expect(stats.channelSubscriptions['cache-invalidation']).toBe(1);
			expect(stats.channelSubscriptions['sync-notifications']).toBe(0);
			expect(stats.syncCodeSubscriptions).toBe(1);
		});

		it('should return empty stats initially', () => {
			const stats = manager.getStats();

			expect(stats.totalConnections).toBe(0);
			expect(stats.channelSubscriptions['live-posts']).toBe(0);
			expect(stats.syncCodeSubscriptions).toBe(0);
		});

		it('should update stats after changes', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			let stats = manager.getStats();
			expect(stats.totalConnections).toBe(1);

			manager.removeConnection(id);

			stats = manager.getStats();
			expect(stats.totalConnections).toBe(0);
		});
	});

	describe('getConnection', () => {
		it('should return connection by ID', () => {
			const socket = createMockWebSocket();
			const id = manager.addConnection(socket as any);

			const connection = manager.getConnection(id);

			expect(connection).toBeDefined();
			expect(connection!.id).toBe(id);
			expect(connection!.socket).toBe(socket);
		});

		it('should return undefined for non-existent connection', () => {
			const connection = manager.getConnection('nonexistent');

			expect(connection).toBeUndefined();
		});
	});
});
