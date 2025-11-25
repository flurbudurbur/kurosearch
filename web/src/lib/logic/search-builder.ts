import { postsClient } from './api-client';
import { serializeSearch } from './tag-serialization';

export class SearchBuilder {
	pid: number;
	tags: kurosearch.ModifiedTag[];
	supertags: kurosearch.Supertag[];
	blockedContent: kurosearch.BlockingGroup[];
	sortProperty: kurosearch.SortProperty;
	sortDirection: kurosearch.SortDirection;
	scoreValue: number;
	rating: kurosearch.Rating;
	scoreComparator: kurosearch.ScoreComparator;
	pageSize: number | undefined;

	// cached for performance
	tagString: string | undefined;

	// user
	apiKey: string;
	userId: string;

	constructor() {
		this.pid = 0;
		this.tags = [];
		this.supertags = [];
		this.blockedContent = [];
		this.sortProperty = 'id';
		this.sortDirection = 'desc';
		this.scoreValue = 0;
		this.rating = 'all';
		this.scoreComparator = '>=';
		this.apiKey = '';
		this.userId = '';
		this.pageSize = undefined;
	}

	withPid(pid: number) {
		this.pid = pid;
		return this;
	}

	withTags(tags: kurosearch.ModifiedTag[]) {
		this.tags = tags;
		return this;
	}

	withSupertags(supertags: kurosearch.Supertag[]) {
		this.supertags = supertags;
		return this;
	}

	withSortProperty(sortProperty: kurosearch.SortProperty) {
		this.sortProperty = sortProperty;
		return this;
	}

	withSortDirection(sortDirection: kurosearch.SortDirection) {
		this.sortDirection = sortDirection;
		return this;
	}

	withScoreValue(scoreValue: number) {
		this.scoreValue = scoreValue;
		return this;
	}

	withScoreComparator(scoreComparator: kurosearch.ScoreComparator) {
		this.scoreComparator = scoreComparator;
		return this;
	}

	withRating(rating: kurosearch.Rating) {
		this.rating = rating;
		return this;
	}

	withBlockedContent(blockedContent: Record<kurosearch.BlockingGroup, boolean>) {
		this.blockedContent = Object.entries(blockedContent)
			.filter(([_, value]) => value)
			.map(([key, _]) => key as kurosearch.BlockingGroup);
		return this;
	}

	withApiKey(apiKey: string) {
		this.apiKey = apiKey || '';
		return this;
	}

	withUserId(userId: string) {
		this.userId = userId || '';
		return this;
	}

	withPageSize(pageSize: number) {
		this.pageSize = pageSize;
		return this;
	}

	async getPageAndCount() {
		this.tagString = serializeSearch(
			this.tags,
			this.sortProperty,
			this.sortDirection,
			this.scoreValue,
			this.rating,
			this.scoreComparator,
			this.blockedContent,
			this.supertags
		);
		return Promise.all([this.getPage(), this.getCount()]);
	}

	async getPage() {
		this.tagString ||= serializeSearch(
			this.tags,
			this.sortProperty,
			this.sortDirection,
			this.scoreValue,
			this.rating,
			this.scoreComparator,
			this.blockedContent,
			this.supertags
		);
		if (this.apiKey && this.userId) {
			postsClient.setAuth(this.apiKey, this.userId);
		}
		return postsClient.getPage(this.pid, this.tagString, this.pageSize);
	}

	async getCount() {
		this.tagString ||= serializeSearch(
			this.tags,
			this.sortProperty,
			this.sortDirection,
			this.scoreValue,
			this.rating,
			this.scoreComparator,
			this.blockedContent,
			this.supertags
		);
		if (this.apiKey && this.userId) {
			postsClient.setAuth(this.apiKey, this.userId);
		}
		return postsClient.getCount(this.tagString);
	}

	getQuery() {
		this.tagString ||= serializeSearch(
			this.tags,
			this.sortProperty,
			this.sortDirection,
			this.scoreValue,
			this.rating,
			this.scoreComparator,
			this.blockedContent,
			this.supertags
		);
		// Note: getQuery was used to build URLs for the deprecated HTTP API
		// With WebSocket-only API, we no longer have URL-based endpoints
		// Return empty string or throw error if this is still needed
		throw new Error('getQuery() is no longer supported with WebSocket API');
	}

	getTagsString() {
		this.tagString ||= serializeSearch(
			this.tags,
			this.sortProperty,
			this.sortDirection,
			this.scoreValue,
			this.rating,
			this.scoreComparator,
			this.blockedContent,
			this.supertags
		);
		return this.tagString;
	}
}
