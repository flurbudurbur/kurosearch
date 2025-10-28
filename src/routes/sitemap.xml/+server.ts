export const prerender = true;

export async function GET() {
	const baseUrl = 'https://flur34.com';
	const pages = [
		{ url: '/', priority: '1.0', changefreq: 'daily' },
		{ url: '/about', priority: '0.8', changefreq: 'monthly' },
		{ url: '/help', priority: '0.8', changefreq: 'monthly' },
		{ url: '/preferences', priority: '0.7', changefreq: 'monthly' },
		{ url: '/saved', priority: '0.7', changefreq: 'weekly' },
		{ url: '/account', priority: '0.6', changefreq: 'monthly' }
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
