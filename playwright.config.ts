import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// @ts-ignore
export default defineConfig({
	globalSetup: './tests/e2e/global-setup.ts',
	globalTeardown: './tests/e2e/global-teardown.ts',
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		timeout: 120 * 1000,
		reuseExistingServer: !isCI,
		env: {
			PUBLIC_MOCK_R34_API: 'true'
		}
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	testIgnore: '**/tests/unit/**',
	reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'html',
	// Allow parallel execution in CI for faster test runs
	workers: isCI ? 2 : undefined,
	// Reduce retries since we're using mocked data
	retries: isCI ? 1 : 0,
	// Fail fast to save CI time
	fullyParallel: true,
	use: {
		headless: true,
		viewport: { width: 1280, height: 720 },
		storageState: undefined,
		// Reduce action timeout for faster failures
		actionTimeout: 10 * 1000,
		// Use load event instead of networkidle for faster page loads
		navigationTimeout: 15 * 1000
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				launchOptions: {
					args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
				}
			}
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		}
	],
	// Reduce test timeout since we're using mocked data
	timeout: 30 * 1000,
	expect: {
		// Reduce expect timeout for faster failures
		timeout: 10 * 1000
	}
});
