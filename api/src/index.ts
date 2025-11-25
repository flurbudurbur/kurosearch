import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import { envOptions, isProd } from './config/env.js';
import { valkeyPlugin } from './plugins/valkey.js';
import { websocketPlugin } from './plugins/websocket.js';

/**
 * Initialize Fastify application
 */
async function buildApp() {
	const fastify = Fastify({
		logger:
			process.env.NODE_ENV === 'production'
				? {
						level: 'info'
						// No transport = JSON output to stdout (Docker-friendly)
					}
				: {
						level: 'info', // Will be updated to 'debug' after env is loaded
						transport: {
							target: 'pino-pretty',
							options: {
								translateTime: 'HH:MM:ss Z',
								ignore: 'pid,hostname'
							}
						}
					},
		trustProxy: true,
		requestIdHeader: 'x-request-id',
		requestIdLogLabel: 'reqId'
	});

	// Register @fastify/env first to load and validate environment variables
	await fastify.register(fastifyEnv, envOptions);

	// Update logger level based on environment
	fastify.log.level = isProd(fastify.config) ? 'info' : 'debug';

	// Initialize version from GitHub
	const { initializeVersion } = await import('./lib/version.js');
	const githubRepo = fastify.config.GITHUB_REPO || 'owner/repo';
	fastify.log.info(`Fetching latest version from GitHub (${githubRepo})...`);
	await initializeVersion(githubRepo);
	const { getVersion } = await import('./lib/version.js');
	fastify.log.info(`Version initialized: ${getVersion()}`);

	// Register CORS plugin directly
	const cors = (await import('@fastify/cors')).default;
	await fastify.register(cors, {
		origin: [fastify.config.FRONTEND_ORIGIN],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Referer'],
		exposedHeaders: ['X-Cache', 'X-Cache-Key']
	});
	fastify.log.info(`CORS configured for origin: ${fastify.config.FRONTEND_ORIGIN}`);

	// Register other plugins
	await fastify.register(valkeyPlugin);
	// WebSocket plugin now includes route registration in the same context
	await fastify.register(websocketPlugin);

	// Apply CSRF protection to all routes
	// TEMPORARILY DISABLED FOR DEBUGGING
	// fastify.addHook('preHandler', csrfProtection);

	// Global error handler - throw errors in handlers, handle them here
	fastify.setErrorHandler((error, request, reply) => {
		request.log.error(error);

		// Use statusCode from error if set, otherwise default to 500
		const statusCode =
			(error as { statusCode?: number }).statusCode ?? (error as { code?: number }).code ?? 500;
		const message = error instanceof Error ? error.message : 'Internal Server Error';

		reply.status(statusCode).send({
			error: message
		});
	});

	// Health check endpoint (no CSRF protection needed)
	fastify.get(
		'/health',
		{
			preHandler: async () => {
				// Skip CSRF for health checks
			}
		},
		async () => {
			const valkeyAvailable = await fastify.isValkeyAvailable();
			return {
				status: 'ok',
				timestamp: new Date().toISOString(),
				valkey: valkeyAvailable ? 'connected' : 'unavailable'
			};
		}
	);

	// Root endpoint
	fastify.get('/', async () => {
		return {
			name: 'flur34 Backend API',
			version: '1.0.0',
			endpoints: {
				health: '/health',
				api: {
					posts: '/api/posts',
					comments: '/api/comments',
					tags: '/api/tags',
					sync: '/api/sync',
					instances: '/api/instances',
					version: '/api/version',
					cache: '/api/cache/invalidate (POST)'
				},
				websocket: '/ws'
			}
		};
	});

	// Register API routes with /api prefix
	const { postsFeature } = await import('./features/posts/index.js');
	const { commentsFeature } = await import('./features/comments/index.js');
	const { tagsFeature } = await import('./features/tags/index.js');
	const { syncFeature } = await import('./features/sync/index.js');
	const { versionFeature } = await import('./features/version/index.js');
	const { cacheFeature } = await import('./features/cache/index.js');
	const { instancesFeature } = await import('./features/instances/index.js');

	await fastify.register(postsFeature, { prefix: '/api' });
	await fastify.register(commentsFeature, { prefix: '/api' });
	await fastify.register(tagsFeature, { prefix: '/api' });
	await fastify.register(syncFeature, { prefix: '/api' });
	await fastify.register(cacheFeature, { prefix: '/api' });
	await fastify.register(instancesFeature, { prefix: '/api' });
	await fastify.register(versionFeature, { prefix: '/api' });

	// Start live posts polling
	const { setLivePostsLogger, startLivePostsPolling } = await import(
		'./features/posts/live-posts.js'
	);
	setLivePostsLogger(fastify.log);
	startLivePostsPolling();

	// Stop polling on shutdown
	fastify.addHook('onClose', async () => {
		const { stopLivePostsPolling } = await import('./features/posts/live-posts.js');
		stopLivePostsPolling();
	});

	return fastify;
}

/**
 * Start the server
 */
async function start() {
	try {
		const fastify = await buildApp();

		// Start listening
		await fastify.listen({
			port: fastify.config.BACKEND_PORT,
			host: fastify.config.BACKEND_HOST
		});

		fastify.log.info(
			`Server listening on http://${fastify.config.BACKEND_HOST}:${fastify.config.BACKEND_PORT}`
		);

		// Graceful shutdown
		const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
		signals.forEach((signal) => {
			process.on(signal, async () => {
				fastify.log.info(`Received ${signal}, shutting down gracefully...`);
				await fastify.close();
				process.exit(0);
			});
		});
	} catch (err) {
		console.error('Error starting server:', err);
		process.exit(1);
	}
}

// Start the server (always start when running with tsx)
start();

export { buildApp };
