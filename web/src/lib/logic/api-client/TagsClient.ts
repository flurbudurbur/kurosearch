import { ApiClient } from './ApiClient';
import { replaceHtmlEntities } from '$lib/logic/replace-html-entities';
import { parseXml } from '$lib/logic/parse-utils';

/**
 * Tags API Client
 * Handles fetching tag suggestions and tag details
 */
export class TagsClient extends ApiClient {
	/**
	 * Get tag suggestions for autocomplete
	 */
	async getTagSuggestions(term: string): Promise<kurosearch.Suggestion[]> {
		const params = {
			autocomplete: '1',
			q: term.replaceAll(' ', '_')
		};

		const responseText = await this.request<string>('tags', params);
		const json = this.parseJSON<r34.Suggestion[] | { message: string }>(responseText);

		if (Array.isArray(json)) {
			if (json.length === 0) {
				throw new Error('No tags found');
			}
			return json.map(this.parseSuggestion);
		} else if ('message' in json) {
			throw new Error(json.message);
		} else {
			throw new Error('Invalid tag suggestions received');
		}
	}

	/**
	 * Get detailed information about a specific tag
	 * Checks IndexedDB cache first
	 */
	async getTagDetails(name: string): Promise<kurosearch.Tag | undefined> {
		// Check IndexedDB cache first
		const idb = await this.getIndexedDB();
		if (idb) {
			const indexedTag = await idb.getIndexedTag(name);
			if (indexedTag) {
				return indexedTag;
			}
		}

		try {
			const params = this.buildParams({
				name
			});

			const responseText = await this.request<string>('tags', params);
			const xml = parseXml(responseText);
			const tagXml = xml.getElementsByTagName('tag')[0];

			const tag = tagXml ? this.parseTag(tagXml.attributes) : undefined;

			// Cache tag in IndexedDB (best-effort, don't block on failures)
			if (tag && idb) {
				try {
					await idb.addIndexedTag(tag);
				} catch {
					// Ignore caching errors
				}
			}

			return tag;
		} catch (error) {
			if (!this.isTestEnv() && this.isDebugMode()) {
				console.warn(`[TagsClient] Failed to get tag details for "${name}"`, error);
			}
			return undefined;
		}
	}

	/**
	 * Parse a tag suggestion from API response
	 */
	private parseSuggestion = (suggestion: r34.Suggestion): kurosearch.Suggestion => ({
		label: replaceHtmlEntities(suggestion.value),
		count: this.extractCount(suggestion.label),
		type: 'tag'
	});

	/**
	 * Extract count from suggestion label
	 * Label format: "tag_name (123)"
	 */
	private extractCount(label: string): number {
		return Number(label.substring(label.lastIndexOf('(') + 1, label.length - 1));
	}

	/**
	 * Parse a tag from XML attributes
	 */
	private parseTag(tag: NamedNodeMap): kurosearch.Tag | undefined {
		const name = tag.getNamedItem('name');
		const count = tag.getNamedItem('count');
		const typeId = tag.getNamedItem('type');

		if (name === null || count === null || typeId === null) {
			return undefined;
		}

		return {
			name: replaceHtmlEntities(name.value),
			count: Number(count.value),
			type: this.parseType(typeId.value)
		};
	}

	/**
	 * Parse tag type from numeric ID
	 */
	private parseType(value: string): kurosearch.TagType {
		const types: kurosearch.TagType[] = [
			'general',
			'artist',
			'general',
			'copyright',
			'character',
			'metadata'
		];

		return types[Number(value)];
	}
}
