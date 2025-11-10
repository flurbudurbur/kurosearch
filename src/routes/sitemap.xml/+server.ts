import { env } from '$env/dynamic/private';
import { getCanonicalUrl } from '$lib/logic/app-config';
import type { RequestEvent } from '@sveltejs/kit';

export const prerender = true;

export async function GET(event: RequestEvent) {
	const baseUrl = getCanonicalUrl(event, env);
	const pages = [
		{ url: '/', priority: '1.0', changefreq: 'daily' },
		{ url: '/about', priority: '0.8', changefreq: 'monthly' },
		{ url: '/help', priority: '0.8', changefreq: 'monthly' },
		{ url: '/instances', priority: '0.8', changefreq: 'weekly' },
		{ url: '/preferences', priority: '0.7', changefreq: 'monthly' },
		{ url: '/saved', priority: '0.7', changefreq: 'weekly' },
		{ url: '/tag', priority: '0.7', changefreq: 'monthly' },
		{ url: '/account', priority: '0.6', changefreq: 'monthly' },
		{ url: '/troubleshoot', priority: '0.5', changefreq: 'monthly' }
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		(page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
