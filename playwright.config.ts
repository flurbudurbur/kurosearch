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
	reporter: isCI ? [['html', { open: 'never' }], ['github']] : [['html', { open: 'never' }]],
	fullyParallel: false,
	use: {
		headless: true,
		viewport: { width: 1280, height: 720 },
		storageState: undefined,
		actionTimeout: 10 * 1000,
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
	timeout: 30 * 1000,
	expect: {
		timeout: 10 * 1000
	}
});
