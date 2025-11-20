export const mockPostsResponse = {
	'@attributes': {
		limit: 100,
		offset: 0,
		count: 2
	},
	post: [
		{
			id: 123456,
			score: 42,
			file_url: 'https://example.com/image1.jpg',
			preview_url: 'https://example.com/preview1.jpg',
			sample_url: 'https://example.com/sample1.jpg',
			directory: '1234',
			hash: 'abc123',
			width: 1920,
			height: 1080,
			tags: 'tag1 tag2 tag3',
			created_at: '2024-01-01 12:00:00'
		},
		{
			id: 123457,
			score: 15,
			file_url: 'https://example.com/image2.png',
			preview_url: 'https://example.com/preview2.png',
			sample_url: 'https://example.com/sample2.png',
			directory: '1235',
			hash: 'def456',
			width: 1280,
			height: 720,
			tags: 'tag4 tag5',
			created_at: '2024-01-02 12:00:00'
		}
	]
};

export const mockPostsXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<posts count="2" offset="0">
  <post id="123456" score="42" file_url="https://example.com/image1.jpg" preview_url="https://example.com/preview1.jpg" sample_url="https://example.com/sample1.jpg" directory="1234" hash="abc123" width="1920" height="1080" tags="tag1 tag2 tag3" created_at="2024-01-01 12:00:00"/>
  <post id="123457" score="15" file_url="https://example.com/image2.png" preview_url="https://example.com/preview2.png" sample_url="https://example.com/sample2.png" directory="1235" hash="def456" width="1280" height="720" tags="tag4 tag5" created_at="2024-01-02 12:00:00"/>
</posts>`;

export const mockCommentsResponse = {
	'@attributes': {
		type: 'comments'
	},
	comment: [
		{
			id: 1,
			post_id: 123456,
			creator: 'user1',
			creator_id: 1001,
			body: 'Great post!',
			created_at: '2024-01-01 13:00:00'
		},
		{
			id: 2,
			post_id: 123456,
			creator: 'user2',
			creator_id: 1002,
			body: 'Nice!',
			created_at: '2024-01-01 14:00:00'
		}
	]
};

export const mockCommentsXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<comments type="comments">
  <comment id="1" post_id="123456" creator="user1" creator_id="1001" body="Great post!" created_at="2024-01-01 13:00:00"/>
  <comment id="2" post_id="123456" creator="user2" creator_id="1002" body="Nice!" created_at="2024-01-01 14:00:00"/>
</comments>`;

export const mockTagsAutocompleteResponse = [
	{
		type: 'tag',
		label: 'artist:test_artist (123)',
		value: 'artist:test_artist'
	},
	{
		type: 'tag',
		label: 'character:test_character (456)',
		value: 'character:test_character'
	},
	{
		type: 'tag',
		label: 'general:test_tag (789)',
		value: 'general:test_tag'
	}
];

export const mockTagDetailsResponse = {
	'@attributes': {
		type: 'tag'
	},
	tag: [
		{
			id: 1,
			name: 'test_tag',
			count: 789,
			type: 0 // general
		}
	]
};

export const mockTagDetailsXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<tags type="tag">
  <tag id="1" name="test_tag" count="789" type="0"/>
</tags>`;

export const mockEmptyPostsResponse = {
	'@attributes': {
		limit: 100,
		offset: 0,
		count: 0
	},
	post: []
};

export const mockCountResponse = {
	'@attributes': {
		count: 12345
	}
};
