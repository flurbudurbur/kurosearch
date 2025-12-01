import type { FastifyReply } from 'fastify';
import { getInstances, type InstancesData } from '../../lib/instances-cache.js';

/**
 * HTTP handler for GET /instances
 * Returns the cached instances data or 503 if unavailable
 */
export async function getInstancesHandler(
	_request: unknown,
	reply: FastifyReply
): Promise<InstancesData | { error: string }> {
	const instances = getInstances();

	if (!instances) {
		return reply.code(503).send({ error: 'Instances unavailable' });
	}

	return instances;
}
