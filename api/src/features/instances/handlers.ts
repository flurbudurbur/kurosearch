import type { FastifyRequest, FastifyReply } from 'fastify';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * HTTP handler for GET /instances
 */
export async function getInstances(_request: FastifyRequest, reply: FastifyReply): Promise<string> {
	// Read the instances.toml file from the api directory
	// Path goes from features/instances/ up to api/
	const instancesPath = join(__dirname, '..', '..', '..', 'instances.toml');
	const instancesToml = await readFile(instancesPath, 'utf-8');

	reply.header('Content-Type', 'text/plain; charset=utf-8');
	return instancesToml;
}
