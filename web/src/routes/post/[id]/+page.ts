import { postsClient } from '$lib/logic/api-client';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Disable prerendering for this dynamic route
export const prerender = false;
// Enable SSR for better SEO and initial load performance
export const ssr = true;

export const load: PageLoad = async ({ params }) => {
	const idString = params.id;

	if (!idString) {
		throw error(400, 'Post ID is required');
	}

	const id = parseInt(idString);

	if (isNaN(id)) {
		throw error(400, 'Invalid post ID');
	}

	try {
		const post = await postsClient.getPost(id);

		if (!post) {
			throw error(404, 'Post not found');
		}

		return {
			post
		};
	} catch (_e) {
		throw error(500, 'Failed to load post');
	}
};
