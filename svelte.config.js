import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import pkg from './package.json' with { type: 'json' };

const pkgVersion = pkg.version;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter(),
		paths: {
			base: ''
		},
		alias: {
			$routes: 'src/routes'
		},
		appDir: 'app',
		version: {
			name: pkgVersion
		},
		csp: {
			mode: 'auto',
			directives: {
				'worker-src': ['self', 'blob:'],
				'default-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'script-src': [
					'self',
					'https://apis.google.com',
					'sha256-OkhWme9R0KBn9/HhayIdrq4L0tupV+XoB9Z6NlRtT8g=',
					'sha256-QQcRtQ7ld24zg8Aw+N4rSSUV74xluhui+0R1h02Axi4=',
					'sha256-fY0qLMpeUxpTNOQC5z9/kLxm8wqt0rKf6+suo48Hmnk=',
					'sha256-yei5Fza+Eyx4G0smvN0xBqEesIKumz6RSyGsU3FJowI=',
					'sha256-0x1SbyeCQ2Of88AcO9vdfsetx3+MkTgFUf48VD9IWA4='
				],
				'connect-src': [
					'self',
					'https://apis.google.com',
					'https://*.rule34.xxx',
					'https://*.googleapis.com',
					'https://api.github.com',
					'https://healthcheck.flur.dev'
				],
				'img-src': ['self', 'data:', 'https://*.rule34.xxx', 'https://*.googleusercontent.com'],
				'media-src': ['self', 'https://*.rule34.xxx']
			}
		},
		prerender: {
			handleHttpError: ({ path, status, response, message }) => {
				if (path.startsWith('/api')) return;
				const code = status ?? response?.status;
				if (code != null) throw new Error(`${code} ${path}`);
				throw new Error(message ?? `Prerender error at ${path}`);
			}
		}
	}
};

export default config;
