/**
 * WebSocket Client
 * Singleton WebSocket connection with reconnection logic, event handling, and type safety
 */

import { browser } from '$app/environment';
import type {
	Channel,
	ClientMessage,
	ServerMessage,
	ConnectionState,
	MessageListener,
	StateChangeListener,
	WebSocketConfig
} from '$lib/types/websocket';

// Check if debug mode is enabled via URL parameter or development mode
const isDebugMode = () => {
	if (import.meta.env.DEV) return true;
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	return params.has('debug');
};

// Helper to log only in debug mode
const debugLog = (...args: unknown[]) => {
	if (isDebugMode()) {
		console.log('[WS]', ...args);
	}
};

const debugError = (...args: unknown[]) => {
	if (isDebugMode()) {
		console.error('[WS]', ...args);
	}
};

// Default configuration
const DEFAULT_CONFIG: Required<Omit<WebSocketConfig, 'url'>> = {
	reconnectDelay: 1000,
	maxReconnectDelay: 120000, // 120 seconds max backoff
	heartbeatInterval: 30000
};

/**
 * WebSocket Client Class
 * Manages WebSocket connection with automatic reconnection and event handling
 */
// Type for pending API requests
type PendingRequest = {
	resolve: (data: unknown) => void;
	reject: (error: Error) => void;
	timeout: ReturnType<typeof setTimeout>;
};

class WebSocketClient {
	private ws: WebSocket | null = null;
	private config: Required<WebSocketConfig>;
	private state: ConnectionState = 'disconnected';
	private reconnectAttempts = 0;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private messageListeners = new Set<MessageListener>();
	private stateChangeListeners = new Set<StateChangeListener>();
	private subscribedChannels = new Set<Channel>();
	private syncCode: string | null = null;
	private isManualDisconnect = false;
	private pendingRequests = new Map<string, PendingRequest>();
	private requestIdCounter = 0;
	private onlineHandler: (() => void) | null = null;
	private offlineHandler: (() => void) | null = null;

	constructor(config: WebSocketConfig) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.setupNetworkListeners();
	}

	/**
	 * Get current connection state
	 */
	getState(): ConnectionState {
		return this.state;
	}

	/**
	 * Get subscribed channels
	 */
	getSubscribedChannels(): Channel[] {
		return Array.from(this.subscribedChannels);
	}

	/**
	 * Connect to WebSocket server
	 */
	connect(): void {
		if (!browser) {
			debugError('WebSocket can only be used in browser environment');
			return;
		}

		if (this.ws?.readyState === WebSocket.OPEN) {
			debugLog('Already connected');
			return;
		}

		if (this.ws?.readyState === WebSocket.CONNECTING) {
			debugLog('Connection already in progress');
			return;
		}

		this.isManualDisconnect = false;
		this.setState('connecting');
		debugLog('Connecting to', this.config.url);

		try {
			console.log('[WS DEBUG] Creating WebSocket connection to:', this.config.url);
			this.ws = new WebSocket(this.config.url);

			this.ws.onopen = () => {
				console.log('[WS DEBUG] WebSocket onopen fired!');
				debugLog('Connected');
				this.setState('connected');
				this.reconnectAttempts = 0;
				this.startHeartbeat();

				// Resubscribe to channels after reconnection
				if (this.subscribedChannels.size > 0) {
					this.subscribe(Array.from(this.subscribedChannels));
				}

				// Resubscribe to sync code after reconnection
				if (this.syncCode) {
					this.subscribeSyncCode(this.syncCode);
				}
			};

			this.ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data) as ServerMessage;
					debugLog('Received:', message.type);
					this.handleMessage(message);
				} catch (error) {
					debugError('Failed to parse message:', error);
				}
			};

			this.ws.onerror = (event) => {
				console.error('[WS DEBUG] WebSocket onerror fired:', event);
				debugError('WebSocket error:', event);
				this.setState('error');
			};

			this.ws.onclose = (event) => {
				console.log('[WS DEBUG] WebSocket onclose fired:', event.code, event.reason);
				debugLog('Disconnected:', event.code, event.reason);
				this.stopHeartbeat();

				if (!this.isManualDisconnect) {
					this.setState('disconnected');
					this.attemptReconnect();
				} else {
					this.setState('disconnected');
				}
			};
		} catch (error) {
			debugError('Failed to create WebSocket:', error);
			this.setState('error');
			this.attemptReconnect();
		}
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect(): void {
		debugLog('Disconnecting');
		this.isManualDisconnect = true;
		this.clearReconnectTimeout();
		this.stopHeartbeat();
		this.removeNetworkListeners();

		if (this.ws) {
			this.ws.close(1000, 'Client disconnect');
			this.ws = null;
		}

		this.setState('disconnected');
	}

	/**
	 * Subscribe to channels
	 */
	subscribe(channels: Channel[]): void {
		if (channels.length === 0) return;

		channels.forEach((channel) => this.subscribedChannels.add(channel));

		// If connected, send immediately. Otherwise, it will be sent when connection opens
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.send({ type: 'subscribe', channels });
			debugLog('Subscribing to channels:', channels);
		} else {
			debugLog('WebSocket not ready, subscription will be sent when connected:', channels);
		}
	}

	/**
	 * Unsubscribe from channels
	 */
	unsubscribe(channels: Channel[]): void {
		if (channels.length === 0) return;

		channels.forEach((channel) => this.subscribedChannels.delete(channel));
		this.send({ type: 'unsubscribe', channels });
		debugLog('Unsubscribing from channels:', channels);
	}

	/**
	 * Subscribe to sync code notifications
	 */
	subscribeSyncCode(code: string): void {
		this.syncCode = code;

		// If connected, send immediately. Otherwise, it will be sent when connection opens
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.send({ type: 'subscribe-sync-code', code });
			debugLog('Subscribing to sync code:', code);
		} else {
			debugLog('WebSocket not ready, sync code subscription will be sent when connected:', code);
		}
	}

	/**
	 * Unsubscribe from sync code notifications
	 */
	unsubscribeSyncCode(): void {
		this.syncCode = null;
		// No explicit unsubscribe message needed - server will handle timeout
	}

	/**
	 * Add message listener
	 */
	onMessage(listener: MessageListener): () => void {
		this.messageListeners.add(listener);
		return () => this.messageListeners.delete(listener);
	}

	/**
	 * Add state change listener
	 */
	onStateChange(listener: StateChangeListener): () => void {
		this.stateChangeListeners.add(listener);
		// Immediately call with current state
		listener(this.state);
		return () => this.stateChangeListeners.delete(listener);
	}

	/**
	 * Send message to server
	 */
	private send(message: ClientMessage): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			debugError('Cannot send message: WebSocket not connected');
			return;
		}

		try {
			this.ws.send(JSON.stringify(message));
		} catch (error) {
			debugError('Failed to send message:', error);
		}
	}

	/**
	 * Send API request and wait for response
	 */
	async request<T = unknown>(
		resource: import('$lib/types/websocket').APIResource,
		params: Record<string, string>
	): Promise<T> {
		// Wait for connection if not connected
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			// If disconnected, try to connect
			if (this.state === 'disconnected') {
				this.connect();
			}

			// Wait for connection (max 10 seconds)
			await this.waitForConnection(10000);
		}

		const id = `req_${++this.requestIdCounter}_${Date.now()}`;

		return new Promise<T>((resolve, reject) => {
			// Set timeout for request (30 seconds)
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(id);
				reject(new Error('Request timeout'));
			}, 30000);

			// Store pending request
			this.pendingRequests.set(id, {
				resolve: resolve as (data: unknown) => void,
				reject,
				timeout
			});

			// Send request
			this.send({
				type: 'api-request',
				id,
				resource,
				params
			});

			debugLog(`Sent API request ${id} for ${resource}`);
		});
	}

	/**
	 * Wait for WebSocket connection
	 */
	private waitForConnection(timeout: number): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			// Already connected
			if (this.ws?.readyState === WebSocket.OPEN) {
				resolve();
				return;
			}

			// Declare cleanup function first before using it
			let timeoutId: ReturnType<typeof setTimeout>;
			let unsubscribe: () => void;

			const cleanup = () => {
				clearTimeout(timeoutId);
				unsubscribe();
			};

			// Set timeout
			timeoutId = setTimeout(() => {
				cleanup();
				reject(new Error('Connection timeout'));
			}, timeout);

			// Wait for connection
			unsubscribe = this.onStateChange((state) => {
				if (state === 'connected') {
					cleanup();
					resolve();
				} else if (state === 'error') {
					cleanup();
					reject(new Error('Connection failed'));
				}
			});
		});
	}

	/**
	 * Handle incoming message
	 */
	private handleMessage(message: ServerMessage): void {
		// Handle API responses
		if (message.type === 'api-response') {
			const pending = this.pendingRequests.get(message.id);
			if (pending) {
				clearTimeout(pending.timeout);
				this.pendingRequests.delete(message.id);

				if (message.success) {
					pending.resolve(message.data);
				} else {
					pending.reject(new Error(message.error || 'Request failed'));
				}
			}
			return;
		}

		if (message.type === 'api-error') {
			const pending = this.pendingRequests.get(message.id);
			if (pending) {
				clearTimeout(pending.timeout);
				this.pendingRequests.delete(message.id);
				pending.reject(new Error(message.error));
			}
			return;
		}

		// Handle generic errors (for better debugging)
		if (message.type === 'error') {
			debugError('Server error:', message.data);
		}

		// Emit to all listeners for non-API messages
		this.messageListeners.forEach((listener) => {
			try {
				listener(message);
			} catch (error) {
				debugError('Error in message listener:', error);
			}
		});
	}

	/**
	 * Set connection state and notify listeners
	 */
	private setState(state: ConnectionState): void {
		if (this.state === state) {
			console.log('[WS DEBUG] setState called but state unchanged:', state);
			return;
		}

		console.log('[WS DEBUG] setState: changing from', this.state, 'to', state);
		console.log('[WS DEBUG] Number of state change listeners:', this.stateChangeListeners.size);
		this.state = state;
		debugLog('State changed to:', state);

		this.stateChangeListeners.forEach((listener) => {
			try {
				console.log('[WS DEBUG] Calling state change listener with state:', state);
				listener(state);
			} catch (error) {
				debugError('Error in state change listener:', error);
			}
		});
	}

	/**
	 * Attempt to reconnect with exponential backoff
	 * Retries indefinitely until connected or manually disconnected
	 */
	private attemptReconnect(): void {
		if (this.isManualDisconnect) return;

		// Don't attempt reconnect while browser is offline
		if (browser && !navigator.onLine) {
			debugLog('Browser offline, skipping reconnect attempt');
			return;
		}

		const delay = Math.min(
			this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
			this.config.maxReconnectDelay
		);

		this.reconnectAttempts++;
		debugLog(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

		this.reconnectTimeout = setTimeout(() => {
			this.connect();
		}, delay);
	}

	/**
	 * Clear reconnection timeout
	 */
	private clearReconnectTimeout(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}

	/**
	 * Start heartbeat ping/pong
	 */
	private startHeartbeat(): void {
		this.stopHeartbeat();

		this.heartbeatInterval = setInterval(() => {
			this.send({ type: 'ping' });
		}, this.config.heartbeatInterval);
	}

	/**
	 * Stop heartbeat
	 */
	private stopHeartbeat(): void {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}

	/**
	 * Setup network online/offline listeners
	 * Automatically reconnects when network comes back online
	 */
	private setupNetworkListeners(): void {
		if (!browser) return;

		this.onlineHandler = () => {
			debugLog('Network online - attempting reconnect');
			this.reconnectAttempts = 0;
			this.clearReconnectTimeout();
			this.connect();
		};

		this.offlineHandler = () => {
			debugLog('Network offline - pausing reconnection attempts');
			this.clearReconnectTimeout();
		};

		window.addEventListener('online', this.onlineHandler);
		window.addEventListener('offline', this.offlineHandler);
	}

	/**
	 * Remove network listeners
	 */
	private removeNetworkListeners(): void {
		if (!browser) return;

		if (this.onlineHandler) {
			window.removeEventListener('online', this.onlineHandler);
			this.onlineHandler = null;
		}
		if (this.offlineHandler) {
			window.removeEventListener('offline', this.offlineHandler);
			this.offlineHandler = null;
		}
	}

	/**
	 * Reset reconnection attempts and immediately attempt to connect
	 * Useful for manual reconnect buttons
	 */
	resetAndReconnect(): void {
		this.reconnectAttempts = 0;
		this.clearReconnectTimeout();
		this.isManualDisconnect = false;
		this.connect();
	}
}

// Singleton instance
let instance: WebSocketClient | null = null;

/**
 * Get WebSocket client instance
 */
export function getWebSocketClient(config?: WebSocketConfig): WebSocketClient {
	if (!instance && config) {
		instance = new WebSocketClient(config);
	}

	if (!instance) {
		throw new Error('WebSocket client not initialized. Call getWebSocketClient with config first.');
	}

	return instance;
}

/**
 * Initialize WebSocket client with environment-aware URL
 */
export function initWebSocketClient(): WebSocketClient {
	if (instance) {
		return instance;
	}

	// Get api URL from environment variable
	const backendUrl = browser
		? import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3001'
		: 'http://localhost:3001';

	// Convert HTTP(S) URL to WS(S) URL
	const wsUrl = backendUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/ws';

	const client = getWebSocketClient({ url: wsUrl });

	// Auto-connect when initialized
	if (browser) {
		client.connect();
	}

	return client;
}

/**
 * Reset WebSocket client (useful for testing)
 */
export function resetWebSocketClient(): void {
	if (instance) {
		instance.disconnect();
		instance = null;
	}
}
