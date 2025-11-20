import { describe, it, expect } from 'vitest';
import { isClientMessage, isValidChannel } from '../../../src/websocket/events.js';
import type { ClientMessage, Channel } from '../../../src/websocket/events.js';

describe('events', () => {
	describe('isClientMessage', () => {
		it('should validate ping message', () => {
			const msg: ClientMessage = { type: 'ping' };
			expect(isClientMessage(msg)).toBe(true);
		});

		it('should validate subscribe message', () => {
			const msg: ClientMessage = { type: 'subscribe', channels: ['live-posts'] };
			expect(isClientMessage(msg)).toBe(true);
		});

		it('should validate unsubscribe message', () => {
			const msg: ClientMessage = { type: 'unsubscribe', channels: ['sync-notifications'] };
			expect(isClientMessage(msg)).toBe(true);
		});

		it('should validate subscribe-sync-code message', () => {
			const msg: ClientMessage = { type: 'subscribe-sync-code', code: '123456' };
			expect(isClientMessage(msg)).toBe(true);
		});

		it('should validate api-request message', () => {
			const msg: ClientMessage = {
				type: 'api-request',
				id: 'req-123',
				resource: 'posts',
				params: { tags: 'test' }
			};
			expect(isClientMessage(msg)).toBe(true);
		});

		it('should reject null', () => {
			expect(isClientMessage(null)).toBe(false);
		});

		it('should reject undefined', () => {
			expect(isClientMessage(undefined)).toBe(false);
		});

		it('should reject non-object', () => {
			expect(isClientMessage('string')).toBe(false);
			expect(isClientMessage(123)).toBe(false);
			expect(isClientMessage(true)).toBe(false);
		});

		it('should reject object without type', () => {
			expect(isClientMessage({ data: 'test' })).toBe(false);
		});

		it('should reject object with invalid type', () => {
			expect(isClientMessage({ type: 'invalid' })).toBe(false);
			expect(isClientMessage({ type: 'pong' })).toBe(false);
			expect(isClientMessage({ type: 'server-message' })).toBe(false);
		});

		it('should reject object with non-string type', () => {
			expect(isClientMessage({ type: 123 })).toBe(false);
			expect(isClientMessage({ type: null })).toBe(false);
			expect(isClientMessage({ type: {} })).toBe(false);
		});

		it('should accept all valid client message types', () => {
			const validTypes = ['ping', 'subscribe', 'unsubscribe', 'subscribe-sync-code', 'api-request'];

			validTypes.forEach((type) => {
				expect(isClientMessage({ type })).toBe(true);
			});
		});

		it('should handle messages with extra properties', () => {
			const msg = {
				type: 'ping',
				extraProp: 'should not affect validation',
				anotherProp: 123
			};
			expect(isClientMessage(msg)).toBe(true);
		});
	});

	describe('isValidChannel', () => {
		it('should validate live-posts channel', () => {
			expect(isValidChannel('live-posts')).toBe(true);
		});

		it('should validate sync-notifications channel', () => {
			expect(isValidChannel('sync-notifications')).toBe(true);
		});

		it('should validate cache-invalidation channel', () => {
			expect(isValidChannel('cache-invalidation')).toBe(true);
		});

		it('should reject invalid channel names', () => {
			expect(isValidChannel('invalid-channel')).toBe(false);
			expect(isValidChannel('live-post')).toBe(false); // Missing 's'
			expect(isValidChannel('sync')).toBe(false);
			expect(isValidChannel('cache')).toBe(false);
		});

		it('should reject empty string', () => {
			expect(isValidChannel('')).toBe(false);
		});

		it('should reject non-string values', () => {
			expect(isValidChannel(123 as any)).toBe(false);
			expect(isValidChannel(null as any)).toBe(false);
			expect(isValidChannel(undefined as any)).toBe(false);
			expect(isValidChannel({} as any)).toBe(false);
			expect(isValidChannel([] as any)).toBe(false);
		});

		it('should be case-sensitive', () => {
			expect(isValidChannel('Live-Posts')).toBe(false);
			expect(isValidChannel('LIVE-POSTS')).toBe(false);
			expect(isValidChannel('Sync-Notifications')).toBe(false);
		});

		it('should reject channels with whitespace', () => {
			expect(isValidChannel(' live-posts')).toBe(false);
			expect(isValidChannel('live-posts ')).toBe(false);
			expect(isValidChannel(' live-posts ')).toBe(false);
		});

		it('should validate all valid channels', () => {
			const validChannels: Channel[] = ['live-posts', 'sync-notifications', 'cache-invalidation'];

			validChannels.forEach((channel) => {
				expect(isValidChannel(channel)).toBe(true);
			});
		});
	});

	describe('type checking', () => {
		it('should allow valid channel types', () => {
			const channels: Channel[] = ['live-posts', 'sync-notifications', 'cache-invalidation'];

			// This test verifies TypeScript compilation more than runtime behavior
			expect(channels.length).toBe(3);
		});

		it('should allow valid client message structures', () => {
			const messages: ClientMessage[] = [
				{ type: 'ping' },
				{ type: 'subscribe', channels: ['live-posts'] },
				{ type: 'unsubscribe', channels: ['sync-notifications'] },
				{ type: 'subscribe-sync-code', code: '123456' },
				{
					type: 'api-request',
					id: 'req-1',
					resource: 'posts',
					params: { tags: 'test' }
				}
			];

			expect(messages.length).toBe(5);
		});
	});
});
