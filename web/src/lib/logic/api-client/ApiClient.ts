import { initWebSocketClient } from '$lib/websocket/client';

type WebSocketClient = ReturnType<typeof initWebSocketClient>;

/**
 * Authentication context for API requests
 */
export interface AuthContext {
	apiKey?: string;
	userId?: string;
}

/**
 * Options for API requests
 */
export interface RequestOptions {
	/** Authentication credentials */
	auth?: AuthContext;
	/** Additional parameters */
	params?: Record<string, string>;
	/** Whether to add auth params (default: true if auth provided) */
	includeAuth?: boolean;
}

/**
 * Abstract base class for API clients
 * Provides common functionality for WebSocket-based API requests
 */
export abstract class ApiClient {
	protected ws: WebSocketClient;
	protected auth: AuthContext = {};

	constructor() {
		this.ws = initWebSocketClient();
	}

	/**
	 * Set authentication context for this client
	 */
	setAuth(apiKey: string, userId: string): void {
		this.auth = { apiKey, userId };
	}

	/**
	 * Clear authentication context
	 */
	clearAuth(): void {
		this.auth = {};
	}

	/**
	 * Get current authentication context
	 */
	getAuth(): AuthContext {
		return { ...this.auth };
	}

	/**
	 * Check if client has authentication credentials
	 */
	protected hasAuth(): boolean {
		return Boolean(this.auth.apiKey && this.auth.userId);
	}

	/**
	 * Build params object with optional auth
	 */
	protected buildParams(
		baseParams: Record<string, string>,
		options: RequestOptions = {}
	): Record<string, string> {
		const params = { ...baseParams, ...(options.params || {}) };

		// Add auth params if available and not explicitly disabled
		const auth = options.auth || this.auth;
		const includeAuth = options.includeAuth !== false;

		if (includeAuth && auth.apiKey && auth.userId) {
			params.api_key = auth.apiKey;
			params.user_id = auth.userId;
		}

		return params;
	}

	/**
	 * Make a WebSocket API request
	 * Handles errors gracefully with debug logging
	 */
	protected async request<T = string>(
		endpoint: import('$lib/types/websocket').APIResource,
		params: Record<string, string>,
		options: { suppressErrors?: boolean } = {}
	): Promise<T> {
		try {
			return await this.ws.request<T>(endpoint, params);
		} catch (error) {
			// Log errors in debug mode or non-test environment
			if (!this.isTestEnv() && this.isDebugMode() && !options.suppressErrors) {
				console.warn(`[ApiClient] Request to "${endpoint}" failed:`, error);
			}
			throw error;
		}
	}

	/**
	 * Check if running in test environment
	 */
	protected isTestEnv(): boolean {
		return typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'test';
	}

	/**
	 * Check if debug mode is enabled via URL parameter
	 */
	protected isDebugMode(): boolean {
		if (typeof window === 'undefined') return false;
		const params = new URLSearchParams(window.location.search);
		return params.has('debug');
	}

	/**
	 * Parse JSON response with error handling
	 */
	protected parseJSON<T>(responseText: string): T {
		try {
			return JSON.parse(responseText);
		} catch (_error) {
			if (this.isDebugMode()) {
				console.error('[ApiClient] Failed to parse JSON:', responseText);
			}
			throw new Error('Invalid JSON response from server');
		}
	}

	/**
	 * Safely import IndexedDB module (may not be available in all environments)
	 */
	protected async getIndexedDB() {
		if (typeof window === 'undefined' || !('indexedDB' in window)) {
			return null;
		}

		try {
			return await import('$lib/indexeddb/idb');
		} catch {
			// IndexedDB not available, gracefully degrade
			return null;
		}
	}

	/**
	 * Check if IndexedDB is available
	 */
	protected isIndexedDBAvailable(): boolean {
		return typeof window !== 'undefined' && 'indexedDB' in window;
	}
}
