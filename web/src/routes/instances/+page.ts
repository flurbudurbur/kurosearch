import type { PageLoad } from './$types';

// Client-only - API fetch happens client-side
export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	try {
		// Fetch instances from backend API (pre-processed JSON)
		const response = await fetch(`${import.meta.env.PUBLIC_BACKEND_URL}/api/instances`);

		if (!response.ok) {
			throw new Error(`Failed to fetch instances: ${response.statusText}`);
		}

		const data = (await response.json()) as {
			version: string;
			instances: flur34.InstanceConfiguration[];
		};

		return {
			instances: data.instances
		};
	} catch (error) {
		console.error('Error loading instances:', error);
		return {
			instances: []
		};
	}
};
