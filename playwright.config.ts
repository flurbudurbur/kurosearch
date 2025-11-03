import { defineConfig, devices } from '@playwright/test';

// @ts-ignore
export default defineConfig({
	globalSetup: './tests/e2e/global-setup.ts',
	globalTeardown: './tests/e2e/global-teardown.ts',
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		timeout: 120 * 1000,
		reuseExistingServer: !process.env.CI,
		env: {
			MOCK_R34_API: 'true'
		}
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	testIgnore: '**/tests/unit/**',
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
	use: {
		headless: true,
		viewport: { width: 1280, height: 720 }
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
	timeout: 60 * 1000,
	expect: {
		timeout: 30 * 1000
	}
});
