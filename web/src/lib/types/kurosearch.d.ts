namespace kurosearch {
	type BlockingGroup = keyof typeof import('../logic/blocking-group-data').BLOCKING_GROUP_TAGS;
	type TagModifier =
		(typeof import('../logic/tag-modifier-data').TAG_MODIFIER_DATA)[number]['modifier'];
	type NullableTagModifier = TagModifier | undefined;
	type TagType = (typeof import('../logic/tag-type-data').TAG_TYPES)[number];
	type PostType = 'image' | 'gif' | 'video';
	type Tag = {
		name: string;
		count: number;
		type: TagType;
	};
	type ModifiedTag = {
		modifier: TagModifier;
		name: string;
		count: number;
		type: TagType;
	};
	type Suggestion = {
		type: TagType;
		label: string;
		count: number;
	};
	type SearchableTag = {
		modifier: TagModifier;
		name: string;
	};
	type Post = {
		preview_url: string;
		sample_url: string;
		file_url: string;
		comment_count: number;
		height: number;
		id: number;
		change: number;
		parent_id: number | undefined;
		rating: Rating;
		sample_height: number;
		sample_width: number;
		score: number;
		source: string;
		status: string;
		tags: Tag[];
		width: number;
		type: string;
	};
	type SortProperty = 'id' | 'score' | 'updated' | 'random';
	type SortDirection = 'asc' | 'desc';
	type ScoreComparator = '>=' | '<=';
	type Supertag = {
		name: string;
		description: string;
		tags: SearchableTag[];
	};
	type Rating = 'safe' | 'questionable' | 'explicit' | 'all';
	type Comment = {
		author: string;
		createdAt: string;
		content: string;
	};
	type SavedPost = {
		id: number;
	};
}
