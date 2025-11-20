import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import { connectionManager } from '../websocket/manager.js';
import {
	isClientMessage,
	isValidChannel,
	type Channel,
	type APIResource
} from '../websocket/events.js';
import {
	handlePostsRequest,
	handleCommentsRequest,
	handleTagsRequest
} from '../websocket/handlers.js';

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
 * Handle incoming WebSocket messages
 */
function handleMessage(connectionId: string, data: string, logger: any): void {
	try {
		const message = JSON.parse(data);

		if (!isClientMessage(message)) {
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
				// Handle API request - proxy to internal handlers
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
 * WebSocket plugin configuration
 * Uses @fastify/websocket v11.x with Fastify 5.x
 *
 * IMPORTANT: Routes must be registered in the same encapsulation context as the plugin
 */
export const websocketPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.log.info('Registering WebSocket plugin...');

	// Register the WebSocket plugin
	await fastify.register(websocket, {
		options: {
			maxPayload: 1024 * 1024,
			clientTracking: true
		}
	});

	fastify.log.info(
		{
			hasWebsocketServer: !!fastify.websocketServer,
			websocketServerType: fastify.websocketServer?.constructor?.name
		},
		'WebSocket plugin registered'
	);

	// Register WebSocket routes IN THE SAME CONTEXT
	// First parameter IS the WebSocket directly (not a wrapper with .socket)
	fastify.get('/ws', { websocket: true }, (socket: WebSocket, request: FastifyRequest) => {
		request.log.info(
			{
				socketType: typeof socket,
				socketConstructor: socket?.constructor?.name,
				isWebSocket: socket?.constructor?.name === 'WebSocket'
			},
			'WebSocket handler invoked'
		);

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
		});

		// Send welcome message
		connectionManager.sendToConnection(connectionId, {
			type: 'pong',
			timestamp: Date.now()
		});
	});

	// WebSocket stats endpoint
	fastify.get('/ws/stats', async () => {
		return connectionManager.getStats();
	});

	fastify.log.info('WebSocket routes registered');
};
