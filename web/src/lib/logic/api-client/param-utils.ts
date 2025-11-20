import { env } from '$env/dynamic/private';

export const appendAuthParams = (url: URL, params: URLSearchParams) => {
	const api_key = url.searchParams.get('api_key') ?? env['RULE34_API_KEY'];
	const user_id = url.searchParams.get('user_id') ?? env['RULE34_API_USER'];

	if (api_key) params.append('api_key', api_key);
	if (user_id) params.append('user_id', user_id);
};

export const createOptionalParamAppender =
	(url: URL, params: URLSearchParams) =>
	(...paramNames: string[]) => {
		for (const name of paramNames) {
			const value = url.searchParams.get(name);
			if (value) params.append(name, value);
		}
	};

export const requireParams = (url: URL, ...paramNames: string[]) => {
	const values: Record<string, string> = {};
	const missing: string[] = [];
	for (const name of paramNames) {
		const value = url.searchParams.get(name);
		if (value) values[name] = value;
		else missing.push(name);
	}
	return { values, missing };
};

// Curried variant to pass fewer arguments at call sites
export const createRequiredParamGetter =
	(url: URL) =>
	(...paramNames: string[]) =>
		requireParams(url, ...paramNames);
