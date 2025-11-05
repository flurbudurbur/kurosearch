/**
 * Playwright Global Setup for E2E Tests
 *
 * Starts the mock Rule34 API server before running E2E tests.
 * This allows E2E tests to run without hitting the production API.
 */

import { startMockServer } from './mock-server';
import { chromium, type FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
	// Set environment variable to use mock API
	process.env.PUBLIC_MOCK_R34_API = 'true';

	// Start the mock server
	await startMockServer();

	console.log('E2E global setup complete - mock server running');

	// Wait for webServer to be fully ready by verifying it can serve requests
	// This prevents race conditions where the port is open but the app isn't ready
	const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';
	await waitForServerReady(baseURL);

	console.log('WebServer verified ready at', baseURL);
}

/**
 * Wait for the web server to be fully ready by making HTTP requests
 * until we get a successful response with valid HTML content
 */
async function waitForServerReady(baseURL: string, maxAttempts = 30): Promise<void> {
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	let lastError: Error | null = null;

	for (let i = 0; i < maxAttempts; i++) {
		try {
			// Try to load the page with a short timeout
			await page.goto(baseURL, {
				waitUntil: 'domcontentloaded',
				timeout: 5000
			});

			// Verify we got valid HTML with a doctype or html tag
			const content = await page.content();
			if (content.includes('<!DOCTYPE') || content.includes('<html')) {
				// Success! Server is ready
				await browser.close();
				return;
			}

			throw new Error('Server returned invalid HTML content');
		} catch (error) {
			lastError = error as Error;

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	await browser.close();

	// If we got here, server never became ready
	throw new Error(
		`WebServer at ${baseURL} did not become ready after ${maxAttempts} attempts. Last error: ${lastError?.message}`
	);
}
