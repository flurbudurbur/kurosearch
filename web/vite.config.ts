import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Split large vendor libraries into separate chunks
					if (id.includes('node_modules')) {
						// Lazy-loaded libraries should be in separate chunks
						if (id.includes('tinygesture')) {
							return 'lazy-tinygesture';
						}
						if (id.includes('svelte')) {
							return 'vendor-svelte';
						}
						return 'vendor';
					}
				}
			}
		},
		// Enable minification and tree-shaking
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.* calls in production
				passes: 2
			}
		}
	},
	plugins: [
		sveltekit(),
		Icons({
			compiler: 'svelte',
			autoInstall: true
		}) as PluginOption
	]
});
