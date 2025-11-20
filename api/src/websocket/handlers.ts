import type { FastifyPluginAsync } from 'fastify';
import type { WebSocket } from 'ws';
import { connectionManager } from './manager.js';
import { isClientMessage, isValidChannel, type Channel, type APIResource } from './events.js';
import type { FastifyRequest } from 'fastify';
import {
	getFromCache,
	setInCache,
	CACHE_TTL,
	CacheKeys,
	broadcastCacheWrite
} from '../lib/cache-utils.js';
import {
	R34_API_URL,
	appendAuthParams,
	requireParams,
	createOptionalParamAppender,
	generateCacheKey
} from '../lib/rule34-client.js';

/**
 * Handle API request over WebSocket
 */
async function handleAPIRequest(
	requestId: string,
	resource: APIResource,
	params: Record<string, string>,
	connectionId: string,
	logger: any
): Promise<void> {
	try {
		let result: unknown;

		switch (resource) {
			case 'posts':
				result = await handlePostsRequest(params, logger);
				break;
			case 'comments':
				result = await handleCommentsRequest(params, logger);
				break;
			case 'tags':
				result = await handleTagsRequest(params, logger);
				break;
			default:
				throw new Error(`Unknown resource: ${resource}`);
		}

		// Send success response
		connectionManager.sendToConnection(connectionId, {
			type: 'api-response',
			id: requestId,
			success: true,
			data: result
		});
	} catch (err) {
		logger.error({ err, requestId, resource }, 'API request failed');

		// Send error response
		connectionManager.sendToConnection(connectionId, {
			type: 'api-error',
			id: requestId,
			error: err instanceof Error ? err.message : 'Unknown error',
			code: 'API_ERROR'
		});
	}
}

/**
 * Handle posts request (same logic as HTTP route)
 */
export async function handlePostsRequest(
	params: Record<string, string>,
	logger: any
): Promise<string> {
	const requestParams = new URLSearchParams(params);
	const apiParams = new URLSearchParams({
		page: 'dapi',
		s: 'post',
		q: 'index'
	});

	const append = createOptionalParamAppender(requestParams, apiParams);
	append('fields', 'pid', 'id', 'tags');
	appendAuthParams(apiParams);

	const limit = requestParams.get('limit');
	if (limit) apiParams.append('limit', limit);

	const isCount = limit === '0';
	if (!isCount) {
		apiParams.append('json', '1');
	}

	// Generate cache key
	const sortedParams = generateCacheKey(apiParams);
	const cacheKey = CacheKeys.posts(sortedParams);

	// Try cache
	const cached = await getFromCache<string>(cacheKey, logger);
	if (cached.hit && cached.data) {
		logger.info({ cacheKey }, '[WS] Cache HIT for posts');
		return cached.data;
	}

	logger.info({ cacheKey }, '[WS] Cache MISS for posts');

	// Fetch from Rule34
	const upstream = await fetch(`${R34_API_URL}?${apiParams.toString()}`);
	const responseText = await upstream.text();

	// Cache if successful
	if (upstream.ok) {
		setInCache(cacheKey, responseText, CACHE_TTL.POSTS, logger)
			.then((result) => {
				if (result.success) {
					broadcastCacheWrite(cacheKey, 'posts', logger);
				}
			})
			.catch((err) => {
				logger.error({ err, cacheKey }, 'Failed to cache posts');
			});
	}

	return responseText;
}

/**
 * Handle comments request (same logic as HTTP route)
 */
export async function handleCommentsRequest(
	params: Record<string, string>,
	logger: any
): Promise<string> {
	const requestParams = new URLSearchParams(params);
	const { values, missing } = requireParams(requestParams, 'post_id');

	if (missing.length) {
		throw new Error(`Missing required param: ${missing.join(', ')}`);
	}

	const postId = values['post_id'];
	const cacheKey = CacheKeys.comments(postId);

	// Try cache
	const cached = await getFromCache<string>(cacheKey, logger);
	if (cached.hit && cached.data) {
		logger.info({ cacheKey }, '[WS] Cache HIT for comments');
		return cached.data;
	}

	logger.info({ cacheKey }, '[WS] Cache MISS for comments');

	// Fetch from Rule34
	const apiParams = new URLSearchParams({
		page: 'dapi',
		s: 'comment',
		q: 'index',
		post_id: postId
	});
	appendAuthParams(apiParams);

	const upstream = await fetch(`${R34_API_URL}?${apiParams.toString()}`);
	const responseText = await upstream.text();

	// Cache if successful
	if (upstream.ok) {
		setInCache(cacheKey, responseText, CACHE_TTL.COMMENTS, logger)
			.then((result) => {
				if (result.success) {
					broadcastCacheWrite(cacheKey, 'comments', logger);
				}
			})
			.catch((err) => {
				logger.error({ err, cacheKey }, 'Failed to cache comments');
			});
	}

	return responseText;
}

/**
 * Handle tags request (same logic as HTTP route)
 */
export async function handleTagsRequest(
	params: Record<string, string>,
	logger: any
): Promise<string> {
	const requestParams = new URLSearchParams(params);
	const isAutocomplete = requestParams.has('autocomplete');

	if (isAutocomplete) {
		const q = requestParams.get('q') || '';
		const cacheKey = CacheKeys.tags('autocomplete', q);

		// Try cache
		const cached = await getFromCache<string>(cacheKey, logger);
		if (cached.hit && cached.data) {
			logger.info({ cacheKey }, '[WS] Cache HIT for tags autocomplete');
			return cached.data;
		}

		logger.info({ cacheKey }, '[WS] Cache MISS for tags autocomplete');

		// Fetch from Rule34
		const upstream = await fetch(`${R34_API_URL}/autocomplete.php?q=${encodeURIComponent(q)}`);
		const responseText = await upstream.text();

		// Cache if successful
		if (upstream.ok) {
			setInCache(cacheKey, responseText, CACHE_TTL.TAGS, logger)
				.then((result) => {
					if (result.success) {
						broadcastCacheWrite(cacheKey, 'tags', logger);
					}
				})
				.catch((err) => {
					logger.error({ err, cacheKey }, 'Failed to cache tags autocomplete');
				});
		}

		return responseText;
	}

	// Tag details
	const apiParams = new URLSearchParams({
		page: 'dapi',
		s: 'tag',
		q: 'index',
		limit: '1'
	});

	createOptionalParamAppender(requestParams, apiParams)('name');
	appendAuthParams(apiParams);

	const sortedParams = generateCacheKey(apiParams);
	const cacheKey = CacheKeys.tags('details', sortedParams);

	// Try cache
	const cached = await getFromCache<string>(cacheKey, logger);
	if (cached.hit && cached.data) {
		logger.info({ cacheKey }, '[WS] Cache HIT for tags details');
		return cached.data;
	}

	logger.info({ cacheKey }, '[WS] Cache MISS for tags details');

	// Fetch from Rule34
	const upstream = await fetch(`${R34_API_URL}?${apiParams.toString()}`);
	const responseText = await upstream.text();

	// Cache if successful
	if (upstream.ok) {
		setInCache(cacheKey, responseText, CACHE_TTL.TAGS, logger)
			.then((result) => {
				if (result.success) {
					broadcastCacheWrite(cacheKey, 'tags', logger);
				}
			})
			.catch((err) => {
				logger.error({ err, cacheKey }, 'Failed to cache tags details');
			});
	}

	return responseText;
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(connectionId: string, data: string, logger: any): void {
	try {
		const message = JSON.parse(data);

		if (!isClientMessage(message)) {
			logger.warn({ message, connectionId }, 'Invalid message format received');
			connectionManager.sendToConnection(connectionId, {
				type: 'error',
				data: {
					message: 'Invalid message format',
					code: 'INVALID_MESSAGE',
					timestamp: Date.now()
				}
			});
			return;
		}

		switch (message.type) {
			case 'ping':
				connectionManager.sendToConnection(connectionId, {
					type: 'pong',
					timestamp: Date.now()
				});
				break;

			case 'api-request': {
				// Handle API request - proxy to internal HTTP routes
				handleAPIRequest(message.id, message.resource, message.params, connectionId, logger);
				break;
			}

			case 'subscribe': {
				const validChannels = message.channels.filter((ch): ch is Channel => isValidChannel(ch));

				if (validChannels.length === 0) {
					connectionManager.sendToConnection(connectionId, {
						type: 'error',
						data: {
							message: 'No valid channels provided',
							code: 'INVALID_CHANNELS',
							timestamp: Date.now()
						}
					});
					return;
				}

				const success = connectionManager.subscribe(connectionId, validChannels);
				if (success) {
					connectionManager.sendToConnection(connectionId, {
						type: 'subscribed',
						channels: validChannels
					});
					logger.info({ connectionId, channels: validChannels }, 'Client subscribed to channels');
				}
				break;
			}

			case 'unsubscribe': {
				const validChannels = message.channels.filter((ch): ch is Channel => isValidChannel(ch));

				const success = connectionManager.unsubscribe(connectionId, validChannels);
				if (success) {
					connectionManager.sendToConnection(connectionId, {
						type: 'unsubscribed',
						channels: validChannels
					});
					logger.info(
						{ connectionId, channels: validChannels },
						'Client unsubscribed from channels'
					);
				}
				break;
			}

			case 'subscribe-sync-code': {
				const { code } = message;
				if (!code || typeof code !== 'string' || code.length !== 6) {
					connectionManager.sendToConnection(connectionId, {
						type: 'error',
						data: {
							message: 'Invalid sync code',
							code: 'INVALID_SYNC_CODE',
							timestamp: Date.now()
						}
					});
					return;
				}

				const success = connectionManager.subscribeSyncCode(connectionId, code);
				if (success) {
					logger.info({ connectionId, syncCode: code }, 'Client subscribed to sync code');
				}
				break;
			}

			default:
				connectionManager.sendToConnection(connectionId, {
					type: 'error',
					data: {
						message: 'Unknown message type',
						code: 'UNKNOWN_MESSAGE_TYPE',
						timestamp: Date.now()
					}
				});
		}
	} catch (err) {
		logger.error({ err, connectionId }, 'Error handling WebSocket message');
		connectionManager.sendToConnection(connectionId, {
			type: 'error',
			data: {
				message: 'Failed to process message',
				code: 'PROCESSING_ERROR',
				timestamp: Date.now()
			}
		});
	}
}

/**
 * WebSocket route handler
 *
 * IMPORTANT: In @fastify/websocket v11.x, the handler receives (socket, request)
 * where socket is the WebSocket object directly from the ws library.
 */
export const websocketHandlers: FastifyPluginAsync = async (fastify) => {
	// Check if websocketServer is available (indicates plugin is registered)
	fastify.log.info(
		{
			hasWebsocketServer: !!fastify.websocketServer,
			websocketServerType: fastify.websocketServer?.constructor?.name
		},
		'Registering WebSocket route'
	);

	// Handler receives connection (with .socket property) and request
	fastify.get('/ws', { websocket: true }, (connection: any, request: FastifyRequest) => {
		request.log.info(
			{
				connectionType: typeof connection,
				connectionConstructor: connection?.constructor?.name,
				hasSocket: 'socket' in connection,
				socketType: connection.socket ? typeof connection.socket : 'no socket',
				socketConstructor: connection.socket?.constructor?.name,
				isWebSocket: connection.socket?.constructor?.name === 'WebSocket',
				connectionKeys: Object.keys(connection || {}).slice(0, 15)
			},
			'WebSocket handler invoked - checking connection structure'
		);

		// Access the actual WebSocket from connection.socket
		const socket = connection.socket as WebSocket;

		// Add connection to manager
		const connectionId = connectionManager.addConnection(socket);

		request.log.info({ connectionId }, 'WebSocket client connected');

		// Handle messages - attach handlers synchronously
		socket.on('message', (data) => {
			handleMessage(connectionId, data.toString(), request.log);
		});

		// Handle errors
		socket.on('error', (error) => {
			request.log.error({ error, connectionId }, 'WebSocket error');
		});

		// Handle close
		socket.on('close', () => {
			request.log.info({ connectionId }, 'WebSocket client disconnected');
			// Connection is automatically removed by the manager
		});

		// Send welcome message
		connectionManager.sendToConnection(connectionId, {
			type: 'pong',
			timestamp: Date.now()
		});
	});

	// WebSocket stats endpoint (for monitoring)
	fastify.get('/ws/stats', async () => {
		return connectionManager.getStats();
	});
};
