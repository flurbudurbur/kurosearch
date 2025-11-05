import 'unplugin-icons/types/svelte';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

// Environment variables from $env/static/private
declare module '$env/static/private' {
	export const VALKEY_HOST: string;
	export const VALKEY_PORT: string;
	export const VALKEY_PASSWORD: string;
	export const VALKEY_DB: string;
	export const VALKEY_ENABLED: string;
}

export {};
