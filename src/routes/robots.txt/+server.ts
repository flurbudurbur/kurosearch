import { getCanonicalUrl } from '$lib/logic/app-config';

export const prerender = true;

export async function GET() {
	const baseUrl = getCanonicalUrl();

	const robotsTxt = `User-agent: *
Allow: /$
Disallow: /

Disallow: /api/
Disallow: /account
Disallow: /saved
Disallow: /preferences
Disallow: /post/
Disallow: /sync
Disallow: /share
Disallow: /query
Disallow: /debug
Disallow: /test

Sitemap: ${baseUrl}/sitemap.xml`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
