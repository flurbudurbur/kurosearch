import { ApiClient } from './ApiClient';
import { replaceHtmlEntities } from '$lib/logic/replace-html-entities';
import { parseXml } from '$lib/logic/parse-utils';

/**
 * Tags API Client
 * Handles fetching tag suggestions and tag details
 */
export class TagsClient extends ApiClient {
	protected getClientName(): string {
		return 'TagsClient';
	}

	/**
	 * Get tag suggestions for autocomplete
	 */
	async getTagSuggestions(term: string): Promise<kurosearch.Suggestion[]> {
		return this.withErrorHandling(
			async () => {
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
			},
			[],
			`Failed to get tag suggestions for "${term}"`
		);
	}

	/**
	 * Get detailed information about a specific tag
	 * Checks IndexedDB cache first
	 */
	async getTagDetails(name: string): Promise<kurosearch.Tag | undefined> {
		return this.withErrorHandling(
			async () => {
				return this.cachedRequest({
					cacheKey: name,
					fetchFn: async () => {
						const params = this.buildParams({
							name
						});

						const responseText = await this.request<string>('tags', params);
						const xml = parseXml(responseText);
						const tagXml = xml.getElementsByTagName('tag')[0];

						return tagXml ? this.parseTag(tagXml.attributes) : undefined;
					},
					getCached: (idb, key) => idb.getIndexedTag(key as string),
					setCached: async (idb, _key, tag) => {
						if (tag) {
							idb.addIndexedTag(tag);
						}
					},
					bestEffort: true
				});
			},
			undefined,
			`Failed to get tag details for "${name}"`
		);
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
