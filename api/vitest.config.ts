import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/tests/**',
				'**/*.spec.ts',
				'**/*.d.ts',
				'**/src/index.ts', // Bootstrap file
				'**/src/config/env.ts' // Config loading
			],
			thresholds: {
				lines: 90,
				functions: 90,
				branches: 85,
				statements: 90
			}
		},
		testTimeout: 10000,
		hookTimeout: 10000
	}
});
