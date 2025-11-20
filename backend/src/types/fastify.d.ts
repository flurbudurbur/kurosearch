import 'fastify';
import type { EnvConfig } from '../config/env.js';

declare module 'fastify' {
	interface FastifyInstance {
		config: EnvConfig;
	}
}
