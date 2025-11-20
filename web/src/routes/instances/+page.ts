import type { PageLoad } from './$types';
import { parse } from 'smol-toml';

type ParsedToml = {
	instance?: Array<{
		name: string;
		url: string;
		country: string;
		description: string;
		source?: string;
		details?: {
			version?: string;
			last_check?: EpochTimeStamp | string;
			uptime?: number;
		};
	}>;
};

const toEpochMs = (value: unknown): number | undefined => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		// If it's seconds, convert to ms
		return value < 1_000_000_000_000 ? value * 1000 : value;
	}
	if (typeof value === 'string') {
		// If numeric string
		const n = Number(value);
		if (Number.isFinite(n)) {
			return n < 1_000_000_000_000 ? n * 1000 : n;
		}
		// If ISO/date string
		const d = Date.parse(value);
		if (!Number.isNaN(d)) return d;
	}
	return undefined;
};

export const load: PageLoad = async ({ fetch }) => {
	try {
		// Fetch instances from API
		const response = await fetch(`${import.meta.env.PUBLIC_BACKEND_URL}/api/instances`);

		if (!response.ok) {
			throw new Error(`Failed to fetch instances: ${response.statusText}`);
		}

		const instanceToml = await response.text();
		const parsedToml = parse(instanceToml) as ParsedToml;

		const instances: flur34.InstanceConfiguration[] = (parsedToml.instance ?? []).map((it) => {
			const lastCheckMs = toEpochMs(it.details?.last_check);
			return {
				name: it.name,
				url: it.url,
				country: it.country,
				description: it.description,
				status: 0, // no status in TOML; set a default or compute it
				source_url: it.source ?? '',
				details: {
					version: it.details?.version ?? 'N/A',
					// Do NOT fall back to "now" — leave 0 if missing/unparseable
					last_check: (lastCheckMs ?? 0) as EpochTimeStamp,
					uptime: it.details?.uptime ?? 0
				}
			};
		});

		return {
			instances
		};
	} catch (error) {
		console.error('Error loading instances:', error);
		return {
			instances: []
		};
	}
};
