namespace r34 {
	type Post = {
		height: string;
		score: string;
		preview_url: string;
		file_url: string;
		parent_id: string;
		sample_url: string;
		sample_width: string;
		sample_height: string;
		rating: string;
		tag_info: r34.Tag[];
		tags: string;
		id: string;
		width: string;
		change: string;
		comment_count: string;
		status: string;
		source: string;
	};
	type Tag = {
		tag: string;
		count: number;
		type: TagType;
	};
	type Suggestion = {
		value: string;
		label: string;
	};
}
