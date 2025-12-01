import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import { envOptions, isProd } from './config/env.js';
import { valkeyPlugin } from './plugins/valkey.js';
import { websocketPlugin } from './plugins/websocket.js';
import { csrfProtection } from './middleware/csrf.js';

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
	try {
		await fastify.register(fastifyEnv, envOptions);
	} catch (error) {
		console.error('\n❌ Environment validation failed:\n');
		if (error instanceof Error) {
			console.error(error.message);
		}
		console.error('\nCheck your .env file or environment variables.\n');
		process.exit(1);
	}

	// Update logger level based on environment
	fastify.log.level = isProd(fastify.config) ? 'info' : 'debug';

	// Initialize version from GitHub
	const { initializeVersion } = await import('./lib/version.js');
	const githubRepo = fastify.config.GITHUB_REPO || 'owner/repo';
	fastify.log.info(`Fetching latest version from GitHub (${githubRepo})...`);
	await initializeVersion(githubRepo);
	const { getVersion } = await import('./lib/version.js');
	fastify.log.info(`Version initialized: ${getVersion()}`);

	// Initialize changelog from GitHub
	const { initializeChangelog } = await import('./lib/changelog-cache.js');
	fastify.log.info('Fetching changelog from GitHub...');
	await initializeChangelog(githubRepo);
	const { getChangelog } = await import('./lib/changelog-cache.js');
	const changelog = getChangelog();
	fastify.log.info(`Changelog initialized: ${changelog ? `v${changelog.version}` : 'unavailable'}`);

	// Initialize instances cache from external URL
	const instancesUrl = fastify.config.INSTANCES_URL || '';
	if (instancesUrl) {
		const { initializeInstances, getInstances } = await import('./lib/instances-cache.js');
		const instancesTtl = fastify.config.INSTANCES_TTL || 300000;
		fastify.log.info(`Fetching instances from ${instancesUrl} (TTL: ${instancesTtl}ms)...`);
		await initializeInstances(instancesUrl, instancesTtl);
		const instancesData = getInstances();
		fastify.log.info(
			`Instances initialized: ${instancesData ? `${instancesData.instances.length} instances` : 'unavailable'}`
		);
	} else {
		fastify.log.info('Instances URL not configured, feature disabled');
	}

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
	fastify.addHook('preHandler', csrfProtection);

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
					changelog: '/api/changelog',
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
	const { changelogFeature } = await import('./features/changelog/index.js');

	await fastify.register(postsFeature, { prefix: '/api' });
	await fastify.register(commentsFeature, { prefix: '/api' });
	await fastify.register(tagsFeature, { prefix: '/api' });
	await fastify.register(syncFeature, { prefix: '/api' });
	await fastify.register(cacheFeature, { prefix: '/api' });
	await fastify.register(instancesFeature, { prefix: '/api' });
	await fastify.register(versionFeature, { prefix: '/api' });
	await fastify.register(changelogFeature, { prefix: '/api' });

	// Start live posts polling
	const { setLivePostsLogger, startLivePostsPolling } =
		await import('./features/posts/live-posts.js');
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
