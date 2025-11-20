import type { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

/**
 * CORS plugin configuration
 * Restricts CORS to the configured frontend origin
 */
export const corsPlugin: FastifyPluginAsync = async (fastify) => {
	await fastify.register(cors, {
		origin: (origin, callback) => {
			// Allow requests from the configured frontend origin or no origin (same-origin)
			if (!origin || origin === fastify.config.FRONTEND_ORIGIN) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'), false);
			}
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'Origin',
			'Referer',
			'Sec-Fetch-Site',
			'Sec-Fetch-Dest'
		],
		exposedHeaders: ['X-Cache', 'X-Cache-Key']
	});

	fastify.log.info(`CORS configured for origin: ${fastify.config.FRONTEND_ORIGIN}`);
};
