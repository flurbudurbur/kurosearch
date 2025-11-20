import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function instancesRoutes(fastify: FastifyInstance) {
	fastify.get('/api/instances', async (_request: FastifyRequest, reply: FastifyReply) => {
		try {
			// Read the instances.toml file from the api directory
			const instancesPath = join(__dirname, '..', '..', 'instances.toml');
			const instancesToml = await readFile(instancesPath, 'utf-8');

			return reply.header('Content-Type', 'text/plain; charset=utf-8').send(instancesToml);
		} catch (error) {
			fastify.log.error({ error }, 'Failed to read instances.toml');
			return reply.status(500).send({ error: 'Failed to load instances data' });
		}
	});
}
