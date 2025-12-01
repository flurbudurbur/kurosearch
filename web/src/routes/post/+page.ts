import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Client-only redirect
export const ssr = false;

// Redirect old /post?id=### URLs to new /post/### format
export const load: PageLoad = async ({ url }) => {
	const idString = url.searchParams.get('id');

	if (idString) {
		// 301 permanent redirect for SEO
		throw redirect(301, `/post/${idString}`);
	}

	// If no ID provided, redirect to home
	throw redirect(301, '/');
};
