import { getEnvFromProcess } from '../config/env.js';

/**
 * Rule34 API URL
 * Note: URL must NOT have trailing slash to match production behavior
 */
export const R34_API_URL = 'https://api.rule34.xxx';

/**
 * Append authentication parameters to URLSearchParams
 * @param params - URLSearchParams to append to
 */
export function appendAuthParams(params: URLSearchParams): void {
	const env = getEnvFromProcess();
	const api_key = env.RULE34_API_KEY;
	const user_id = env.RULE34_API_USER;

	if (api_key) params.append('api_key', api_key);
	if (user_id) params.append('user_id', user_id);
}

/**
 * Create a function to append optional parameters from request query
 * @param requestParams - Original request query parameters
 * @param targetParams - Target URLSearchParams to append to
 * @returns Function that appends specified param names if they exist
 */
export function createOptionalParamAppender(
	requestParams: URLSearchParams,
	targetParams: URLSearchParams
) {
	return (...paramNames: string[]) => {
		for (const name of paramNames) {
			const value = requestParams.get(name);
			if (value) targetParams.append(name, value);
		}
	};
}

/**
 * Require specific parameters from request
 * @param requestParams - Request query parameters
 * @param paramNames - Required parameter names
 * @returns Object with values and missing parameter names
 */
export function requireParams(
	requestParams: URLSearchParams,
	...paramNames: string[]
): { values: Record<string, string>; missing: string[] } {
	const values: Record<string, string> = {};
	const missing: string[] = [];

	for (const name of paramNames) {
		const value = requestParams.get(name);
		if (value) values[name] = value;
		else missing.push(name);
	}

	return { values, missing };
}

/**
 * Generate a consistent cache key from sorted parameters
 * @param params - URLSearchParams to generate key from
 * @returns Cache key string
 */
export function generateCacheKey(params: URLSearchParams): string {
	return Array.from(params.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `${k}=${v}`)
		.join('&');
}
