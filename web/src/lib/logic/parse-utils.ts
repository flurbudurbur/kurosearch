export const parseXml = (text: string) => {
	const cleaned = text.replace(/^\uFEFF/, '').replace(/^[^<]+/, '');
	const parser = new DOMParser();
	return parser.parseFromString(cleaned, 'text/xml');
};

export const parseJson = async (response: Response) => {
	try {
		return await response.clone().json();
	} catch {
		const txt = await response.text();
		const cleaned = txt.replace(/^\uFEFF/, '').replace(/^[^[{]+/, '');
		return JSON.parse(cleaned);
	}
};
