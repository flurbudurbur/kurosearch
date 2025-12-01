/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

// Cache names with version for proper invalidation
const STATIC_CACHE = `static-cache-${version}`;
const IMAGES_CACHE = 'images-cache-v1';
const RULE34_IMAGES_CACHE = 'rule34-images-cache-v1';
const API_CACHE = 'api-cache-v1';

// Assets to precache (built files + static files)
const PRECACHE_ASSETS = [...build, ...files];

// Max entries per cache
const MAX_ENTRIES = {
	images: 500,
	rule34Images: 1000,
	api: 100
};

// Install event - precache static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(STATIC_CACHE);
			await cache.addAll(PRECACHE_ASSETS);
			// Skip waiting to activate immediately
			await self.skipWaiting();
		})()
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Delete old static caches (versioned)
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((name) => name.startsWith('static-cache-') && name !== STATIC_CACHE)
					.map((name) => caches.delete(name))
			);
			// Claim all clients immediately
			await self.clients.claim();
		})()
	);
});

// Helper: Check if URL matches a pattern
function matchesPattern(url: URL, pattern: RegExp): boolean {
	return pattern.test(url.href);
}

// Helper: Check if response is cacheable
function isCacheableResponse(response: Response): boolean {
	return response.status === 0 || response.status === 200;
}

// Helper: Limit cache size by removing oldest entries
async function limitCacheSize(cacheName: string, maxEntries: number): Promise<void> {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	if (keys.length > maxEntries) {
		// Remove oldest entries (first added)
		const keysToDelete = keys.slice(0, keys.length - maxEntries);
		await Promise.all(keysToDelete.map((key) => cache.delete(key)));
	}
}

// Strategy: Cache First (for images)
async function cacheFirst(
	request: Request,
	cacheName: string,
	maxEntries: number
): Promise<Response> {
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	try {
		const networkResponse = await fetch(request);
		if (isCacheableResponse(networkResponse)) {
			const cache = await caches.open(cacheName);
			// Clone response before caching (response can only be consumed once)
			cache.put(request, networkResponse.clone());
			// Limit cache size in background
			limitCacheSize(cacheName, maxEntries);
		}
		return networkResponse;
	} catch {
		// Return a fallback or error response
		return new Response('Network error', { status: 503 });
	}
}

// Strategy: Network First with timeout (for API)
async function networkFirst(
	request: Request,
	cacheName: string,
	maxEntries: number,
	timeoutMs: number = 10000
): Promise<Response> {
	try {
		// Race between network and timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		const networkResponse = await fetch(request, { signal: controller.signal });
		clearTimeout(timeoutId);

		if (isCacheableResponse(networkResponse)) {
			const cache = await caches.open(cacheName);
			cache.put(request, networkResponse.clone());
			limitCacheSize(cacheName, maxEntries);
		}
		return networkResponse;
	} catch {
		// Network failed or timed out - try cache
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}
		return new Response('Network error and no cache available', { status: 503 });
	}
}

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	// Skip WebSocket requests
	if (url.protocol === 'ws:' || url.protocol === 'wss:') {
		return;
	}

	// Skip chrome-extension and other non-http(s) protocols
	if (!url.protocol.startsWith('http')) {
		return;
	}

	// Rule34 images - Cache First
	if (matchesPattern(url, /^https:\/\/.*\.rule34\.xxx\/.*\.(jpg|jpeg|png|gif|webp)$/i)) {
		event.respondWith(cacheFirst(event.request, RULE34_IMAGES_CACHE, MAX_ENTRIES.rule34Images));
		return;
	}

	// Rule34 API - Network First with timeout
	if (matchesPattern(url, /^https:\/\/api\.rule34\.xxx\//i)) {
		event.respondWith(networkFirst(event.request, API_CACHE, MAX_ENTRIES.api, 10000));
		return;
	}

	// General images - Cache First
	if (matchesPattern(url, /\.(?:jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
		event.respondWith(cacheFirst(event.request, IMAGES_CACHE, MAX_ENTRIES.images));
		return;
	}

	// Static assets from same origin - Cache First with static cache
	if (url.origin === self.location.origin) {
		event.respondWith(
			(async () => {
				// Try static cache first
				const cachedResponse = await caches.match(event.request);
				if (cachedResponse) {
					return cachedResponse;
				}
				// Fall back to network
				return fetch(event.request);
			})()
		);
		return;
	}
});

// Handle messages from clients
self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
