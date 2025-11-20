import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getVersion } from '../lib/version.js';

export async function versionRoutes(fastify: FastifyInstance) {
	fastify.get('/api/version', async (_request: FastifyRequest, reply: FastifyReply) => {
		return reply.send({
			containerVersion: getVersion()
		});
	});
}
