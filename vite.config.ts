import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
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
						if (id.includes('smol-toml')) {
							return 'lazy-toml';
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
		}),
		VitePWA({
			strategies: 'generateSW',
			injectRegister: 'auto',
			workbox: {
				runtimeCaching: [
					{
						urlPattern: /\.(?:jpg|jpeg|png|gif|webp|avif|svg)$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-cache',
							expiration: {
								maxEntries: 500,
								maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/.*\.rule34\.xxx\/.*\.(jpg|jpeg|png|gif|webp)$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'rule34-images-cache',
							expiration: {
								maxEntries: 1000,
								maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/api\.rule34\.xxx\//i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 5 * 60 // 5 minutes
							},
							networkTimeoutSeconds: 10
						}
					}
				]
			},
			manifest: {
				name: 'kurosearch',
				short_name: 'kurosearch',
				description: 'Rule34 browsing re-imagined',
				theme_color: '#000',
				background_color: '#000',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: 'icon/ks-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icon/ks-maskable-384.png',
						sizes: '384x384',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icon/ks-maskable-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icon/ks-maskable-128.png',
						sizes: '128x128',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icon/ks-maskable-96.png',
						sizes: '96x96',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icon/ks-maskable-72.png',
						sizes: '72x72',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icon/ks-maskable-48.png',
						sizes: '48x48',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icon/ks-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'icon/ks-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					}
				]
			}
		})
	]
});
