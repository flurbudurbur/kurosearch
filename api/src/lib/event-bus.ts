import type { FastifyBaseLogger } from 'fastify';

/**
 * Event payload types for the event bus
 */

export interface CacheWriteEvent {
	key: string;
	ttl: number;
	size?: number;
}

export interface CacheInvalidateEvent {
	pattern: string;
	count?: number;
}

export interface CacheClearEvent {
	prefix?: string;
}

/**
 * All possible event types and their payloads
 */
export type EventMap = {
	'cache:write': CacheWriteEvent;
	'cache:invalidate': CacheInvalidateEvent;
	'cache:clear': CacheClearEvent;
};

/**
 * Event listener function type
 */
type EventListener<T> = (payload: T) => void | Promise<void>;

/**
 * Simple typed event bus for decoupling components
 *
 * Primarily used to break circular dependencies between:
 * - cache-utils (emits cache events)
 * - websocket manager (listens to cache events for broadcasting)
 */
export class EventBus {
	private listeners: Map<keyof EventMap, Set<EventListener<any>>> = new Map();
	private logger?: FastifyBaseLogger;

	constructor(logger?: FastifyBaseLogger) {
		this.logger = logger;
	}

	/**
	 * Register an event listener
	 */
	on<K extends keyof EventMap>(event: K, listener: EventListener<EventMap[K]>): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener);

		this.logger?.debug({ event }, '[EventBus] Listener registered');
	}

	/**
	 * Unregister an event listener
	 */
	off<K extends keyof EventMap>(event: K, listener: EventListener<EventMap[K]>): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.delete(listener);

			if (listeners.size === 0) {
				this.listeners.delete(event);
			}

			this.logger?.debug({ event }, '[EventBus] Listener unregistered');
		}
	}

	/**
	 * Emit an event to all registered listeners
	 */
	async emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): Promise<void> {
		const listeners = this.listeners.get(event);
		if (!listeners || listeners.size === 0) {
			this.logger?.trace({ event }, '[EventBus] No listeners for event');
			return;
		}

		this.logger?.trace({ event, listenerCount: listeners.size }, '[EventBus] Emitting event');

		// Execute all listeners (async or sync)
		const promises: Promise<void>[] = [];
		for (const listener of listeners) {
			try {
				const result = listener(payload);
				if (result instanceof Promise) {
					promises.push(result);
				}
			} catch (error) {
				this.logger?.error({ event, error }, '[EventBus] Listener error (sync)');
			}
		}

		// Wait for all async listeners
		if (promises.length > 0) {
			const results = await Promise.allSettled(promises);
			results.forEach((result, index) => {
				if (result.status === 'rejected') {
					this.logger?.error(
						{ event, error: result.reason, index },
						'[EventBus] Listener error (async)'
					);
				}
			});
		}
	}

	/**
	 * Remove all listeners for all events
	 */
	removeAllListeners(): void {
		this.listeners.clear();
		this.logger?.debug('[EventBus] All listeners removed');
	}

	/**
	 * Get count of listeners for an event
	 */
	listenerCount(event: keyof EventMap): number {
		return this.listeners.get(event)?.size ?? 0;
	}
}

/**
 * Global singleton event bus instance
 * Used across the application to decouple components
 */
let eventBusInstance: EventBus | null = null;

/**
 * Get or create the global event bus instance
 */
export function getEventBus(logger?: FastifyBaseLogger): EventBus {
	if (!eventBusInstance) {
		eventBusInstance = new EventBus(logger);
	}
	return eventBusInstance;
}

/**
 * Reset the event bus (primarily for testing)
 */
export function resetEventBus(): void {
	if (eventBusInstance) {
		eventBusInstance.removeAllListeners();
	}
	eventBusInstance = null;
}
