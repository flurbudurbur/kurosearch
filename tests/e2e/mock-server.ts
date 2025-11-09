/**
 * Mock HTTP Server for E2E Tests
 *
 * This server mocks the external Rule34 API responses for E2E testing.
 * It intercepts requests that would normally go to api.rule34.xxx
 * and returns mock data instead.
 */

import { createServer, type Server } from 'node:http';
import { mockPosts } from '../integration/mocks/data/posts';
import { mockTagSuggestions, createMockTagXml } from '../integration/mocks/data/tags';
import { mockCommentsXml, mockEmptyCommentsXml } from '../integration/mocks/data/comments';

let server: Server | null = null;

/**
 * Starts the mock server on port 3334
 * This server responds to requests as if it were api.rule34.xxx
 */
export async function startMockServer(): Promise<void> {
	if (server) {
		console.log('Mock server already running');
		return;
	}

	return new Promise((resolve) => {
		server = createServer((req, res) => {
			const url = new URL(req.url || '/', 'http://localhost:3334');
			const params = url.searchParams;

			// Enable CORS
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

			if (req.method === 'OPTIONS') {
				res.writeHead(200);
				res.end();
				return;
			}

			try {
				// Handle autocomplete endpoint (tags)
				if (url.pathname === '/autocomplete.php') {
					handleAutocompleteRequest(params, res);
					return;
				}

				// Handle posts endpoint
				if (params.get('s') === 'post' && params.get('q') === 'index') {
					handlePostsRequest(params, res);
					return;
				}

				// Handle tags endpoint
				if (params.get('s') === 'tag') {
					handleTagsRequest(params, res);
					return;
				}

				// Handle comments endpoint
				if (params.get('s') === 'comment') {
					handleCommentsRequest(params, res);
					return;
				}

				// Unknown endpoint
				res.writeHead(404, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Not found' }));
			} catch (error) {
				console.error('Mock server error:', error);
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Internal server error' }));
			}
		});

		server.listen(3334, () => {
			console.log('Mock Rule34 API server running on http://localhost:3334');
			resolve();
		});
	});
}

/**
 * Stops the mock server
 */
export async function stopMockServer(): Promise<void> {
	if (!server) {
		return;
	}

	return new Promise((resolve, reject) => {
		server!.close((err) => {
			if (err) {
				reject(err);
			} else {
				server = null;
				console.log('Mock server stopped');
				resolve();
			}
		});
	});
}

/**
 * Handle /api/posts requests
 */
function handlePostsRequest(params: URLSearchParams, res: any): void {
	const limit = params.get('limit');
	const pid = params.get('pid');
	const id = params.get('id');
	const tags = params.get('tags');

	// Handle count request (limit=0)
	if (limit === '0') {
		let count: number;

		if (!tags) {
			count = mockPosts.length > 0 ? 11000000 : 0;
		} else {
			const actualTags = tags
				.split(/\s+/)
				.filter(
					(tag) =>
						tag &&
						!tag.startsWith('sort:') &&
						!tag.startsWith('score:') &&
						!tag.startsWith('rating:')
				);

			if (actualTags.length > 0) {
				const filteredPosts = mockPosts.filter((p) => {
					const postTags = p.tags.split(' ');
					return actualTags.every((tag) => {
						if (tag.startsWith('-')) {
							return !postTags.includes(tag.substring(1));
						}
						if (tag.startsWith('(') && tag.endsWith(')') && tag.includes('~')) {
							const orTags = tag
								.slice(1, -1)
								.split('~')
								.map((t) => t.trim());
							return orTags.some((orTag) => postTags.includes(orTag));
						}
						return postTags.includes(tag);
					});
				});
				count = filteredPosts.length;
			} else {
				count = mockPosts.length > 0 ? 11000000 : 0;
			}
		}

		res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
		res.end(`<?xml version="1.0" encoding="UTF-8"?>
<posts count="${count}" offset="0"/>`);
		return;
	}

	// Handle specific post ID
	if (id) {
		const post = mockPosts.find((p) => p.id === id);
		if (post) {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify([post]));
		} else {
			res.writeHead(404, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Post not found' }));
		}
		return;
	}

	// Handle tag filtering
	let filteredPosts = mockPosts;
	if (tags) {
		const actualTags = tags
			.split(/\s+/)
			.filter(
				(tag) =>
					tag && !tag.startsWith('sort:') && !tag.startsWith('score:') && !tag.startsWith('rating:')
			);

		if (actualTags.length > 0) {
			filteredPosts = mockPosts.filter((p) => {
				const postTags = p.tags.split(' ');
				return actualTags.every((tag) => {
					if (tag.startsWith('-')) {
						return !postTags.includes(tag.substring(1));
					}
					if (tag.startsWith('(') && tag.endsWith(')') && tag.includes('~')) {
						const orTags = tag
							.slice(1, -1)
							.split('~')
							.map((t) => t.trim());
						return orTags.some((orTag) => postTags.includes(orTag));
					}
					return postTags.includes(tag);
				});
			});
		}
	}

	// Handle pagination
	const pageSize = parseInt(limit || '42');
	const pageNum = parseInt(pid || '0');
	const startIndex = pageNum * pageSize;
	const endIndex = startIndex + pageSize;
	const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(paginatedPosts));
}

/**
 * Handle /autocomplete.php requests (tag autocomplete)
 */
function handleAutocompleteRequest(params: URLSearchParams, res: any): void {
	const query = params.get('q') || '';

	const filtered = mockTagSuggestions.filter((s) =>
		s.value.toLowerCase().includes(query.toLowerCase())
	);

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(filtered));
}

/**
 * Handle /api/tags requests (tag details)
 */
function handleTagsRequest(params: URLSearchParams, res: any): void {
	const name = params.get('name');

	// Handle tag details
	if (name) {
		res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
		res.end(createMockTagXml(name));
		return;
	}

	// Default: return empty tags
	res.writeHead(404, { 'Content-Type': 'text/xml; charset=utf-8' });
	res.end(`<?xml version="1.0" encoding="UTF-8"?>
<tags/>`);
}

/**
 * Handle /api/comments requests
 * Note: The comments API route sends 'post_id' parameter
 */
function handleCommentsRequest(params: URLSearchParams, res: any): void {
	const postId = params.get('post_id');

	if (!postId) {
		res.writeHead(400, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Missing required query param: post_id' }));
		return;
	}

	const xml = postId === '1' ? mockCommentsXml : mockEmptyCommentsXml;

	res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
	res.end(xml);
}
