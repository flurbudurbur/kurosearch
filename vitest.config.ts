import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'mock-virtual-icons',
			resolveId(id) {
				if (id.startsWith('virtual:icons/')) {
					return id;
				}
			},
			load(id) {
				if (id.startsWith('virtual:icons/')) {
					// Return a stub Svelte 5 component that mimics a function component
					return `export default function Icon(anchor, props) { return null; }`;
				}
			}
		}
	],
	resolve: {
		conditions: ['browser']
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['tests/unit/**/*.{test,spec}.{ts,js}'],
		setupFiles: ['tests/setup/setup.ts'],
		coverage: {
			reporter: ['json-summary', 'text'],
			include: ['test/unit/**/*.ts'],
			exclude: ['src/**/*.d.ts']
		},
		testTimeout: 10000
	}
});
