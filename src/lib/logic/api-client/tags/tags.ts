import { replaceHtmlEntities } from '$lib/logic/replace-html-entities';
import { parseXml } from '$lib/logic/parse-utils';
import { initWebSocketClient } from '$lib/websocket/client';

export const getTagSuggestions = async (term: string): Promise<kurosearch.Suggestion[]> => {
	const ws = initWebSocketClient();

	// Build params for WebSocket request
	const params: Record<string, string> = {
		autocomplete: '1',
		q: term.replaceAll(' ', '_')
	};

	// Send WebSocket request
	const responseText = await ws.request<string>('tags', params);

	// Parse JSON response
	const json = JSON.parse(responseText);

	if (Array.isArray(json)) {
		if (json.length === 0) {
			throw new Error('No tags found');
		} else {
			return json.map(parseSuggestion);
		}
	} else if ((json as any).message) {
		throw new Error((json as any).message);
	} else {
		throw new Error('Invalid tag suggestions received');
	}
};

export const getTagDetails = async (
	name: string,
	apiKey: string,
	userId: string
): Promise<kurosearch.Tag | undefined> => {
	// Try IndexedDB cache only in a browser with IndexedDB
	if (typeof window !== 'undefined' && 'indexedDB' in window) {
		try {
			const { getIndexedTag } = await import('$lib/indexeddb/idb');
			const indexedTag = await getIndexedTag(name);
			if (indexedTag) {
				return indexedTag;
			}
		} catch {
			// ignore cache if idb module fails to load
			/* c8 ignore next */
			void 0;
		}
	}

	const ws = initWebSocketClient();

	// Build params for WebSocket request
	const params: Record<string, string> = {
		name
	};

	if (userId && apiKey) {
		params.api_key = apiKey;
		params.user_id = userId;
	}

	// Send WebSocket request
	const responseText = await ws.request<string>('tags', params);

	// Parse XML response
	const xml = parseXml(responseText);
	const tagXml = xml.getElementsByTagName('tag')[0];

	const tag = tagXml ? parseTag(tagXml.attributes) : undefined;
	if (tag && typeof window !== 'undefined' && 'indexedDB' in window) {
		// Best-effort caching; don't block on failures
		try {
			const { addIndexedTag } = await import('$lib/indexeddb/idb');
			addIndexedTag(tag);
		} catch {
			// ignore caching errors
		}
	}
	return tag;
};

const parseSuggestion = (suggestion: r34.Suggestion): kurosearch.Suggestion => ({
	label: replaceHtmlEntities(suggestion.value),
	count: extractCount(suggestion.label),
	type: 'tag'
});

const extractCount = (label: string) => {
	return Number(label.substring(label.lastIndexOf('(') + 1, label.length - 1));
};

const parseTag = (tag: NamedNodeMap): kurosearch.Tag | undefined => {
	const name = tag.getNamedItem('name');
	const count = tag.getNamedItem('count');
	const typeId = tag.getNamedItem('type');

	if (name === null || count === null || typeId === null) {
		return undefined;
	}

	return {
		name: replaceHtmlEntities(name.value),
		count: Number(count.value),
		type: parseType(typeId.value)
	};
};

const parseType = (value: string): kurosearch.TagType => {
	const types: kurosearch.TagType[] = [
		'general',
		'artist',
		'general',
		'copyright',
		'character',
		'metadata'
	];

	return types[Number(value)];
};
