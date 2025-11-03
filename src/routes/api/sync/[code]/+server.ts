import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { _consumeTempFile } from '../+server.js';

export const GET: RequestHandler = async ({ params }) => {
	const code = params.code;

	if (!code) {
		throw error(400, 'Code is required');
	}

	try {
		const content = await _consumeTempFile(code);

		if (!content) {
			throw error(404, 'Code not found or expired');
		}

		return new Response(content, {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		if (err instanceof Error && err.message.includes('Code not found')) {
			throw err; // Re-throw our custom error
		}
		throw error(500, 'Failed to read config file');
	}
};
