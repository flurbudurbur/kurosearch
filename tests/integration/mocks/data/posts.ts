/**
 * Mock post data for integration tests
 * Based on real Rule34 API response structures
 */

export const createMockPost = (overrides?: Partial<r34.Post>): r34.Post => ({
	id: '1',
	height: '1080',
	width: '1920',
	score: '10',
	preview_url: 'https://api-cdn.rule34.xxx/thumbnails/1234/thumbnail_abc123.jpg',
	file_url: 'https://api-cdn.rule34.xxx/images/1234/abc123.jpg',
	parent_id: '',
	sample_url: 'https://api-cdn.rule34.xxx/samples/1234/sample_abc123.jpg',
	sample_width: '800',
	sample_height: '600',
	rating: 's',
	tag_info: [
		{ tag: 'tag1', count: 100, type: 'general' },
		{ tag: 'tag2', count: 50, type: 'general' }
	],
	tags: 'tag1 tag2',
	change: '1234567890',
	comment_count: '0',
	status: 'active',
	source: '',
	...overrides
});

// Diverse post collection with varied content types, ratings, and metadata
export const mockPosts: r34.Post[] = [
	// Post 1: Default test post with ID '1' (used by many tests)
	createMockPost({
		id: '1',
		height: '1750',
		width: '1400',
		score: '8',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/2288/thumbnail_bae6fd24759b5f48abaac7a75e90e98b.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/2288/bae6fd24759b5f48abaac7a75e90e98b.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/2288/sample_bae6fd24759b5f48abaac7a75e90e98b.jpg',
		sample_width: '850',
		sample_height: '1063',
		rating: 's',
		tags: 'sfw ai_generated smile pokemon city night',
		tag_info: [
			{ tag: 'sfw', count: 1000000, type: 'general' },
			{ tag: 'ai_generated', count: 50000, type: 'general' },
			{ tag: 'smile', count: 1564979, type: 'general' },
			{ tag: 'pokemon', count: 800000, type: 'copyright' },
			{ tag: 'city', count: 30000, type: 'general' },
			{ tag: 'night', count: 25000, type: 'general' }
		],
		change: '1761824014',
		comment_count: '1',
		status: 'active',
		source: 'https://www.redgifs.com/watch/idealisticenergeticamericanavocet'
	}),
	// Post 2: Safe-rated with comments (real API ID)
	createMockPost({
		id: '15305109',
		height: '1750',
		width: '1400',
		score: '8',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/2288/thumbnail_bae6fd24759b5f48abaac7a75e90e98b.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/2288/bae6fd24759b5f48abaac7a75e90e98b.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/2288/sample_bae6fd24759b5f48abaac7a75e90e98b.jpg',
		sample_width: '850',
		sample_height: '1063',
		rating: 's',
		tags: 'sfw ai_generated smile pokemon city night',
		tag_info: [
			{ tag: 'sfw', count: 1000000, type: 'general' },
			{ tag: 'ai_generated', count: 50000, type: 'general' },
			{ tag: 'smile', count: 1564979, type: 'general' },
			{ tag: 'pokemon', count: 800000, type: 'copyright' },
			{ tag: 'city', count: 30000, type: 'general' },
			{ tag: 'night', count: 25000, type: 'general' }
		],
		change: '1761824014',
		comment_count: '1',
		status: 'active',
		source: 'https://www.redgifs.com/watch/idealisticenergeticamericanavocet'
	}),
	// Post 3: Explicit with scenery tag
	createMockPost({
		id: '15301488',
		height: '1757',
		width: '1259',
		score: '0',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/2288/thumbnail_aed23363c2825c09ad49f37f38a1b2b7918bee56.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/2288/aed23363c2825c09ad49f37f38a1b2b7918bee56.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/2288/sample_aed23363c2825c09ad49f37f38a1b2b7918bee56.jpg',
		sample_width: '850',
		sample_height: '1186',
		rating: 'e',
		tags: 'scenery anthro comic duo male female sex kinktober_2025',
		tag_info: [
			{ tag: 'scenery', count: 15000, type: 'general' },
			{ tag: 'anthro', count: 500000, type: 'general' },
			{ tag: 'comic', count: 80000, type: 'general' },
			{ tag: 'duo', count: 300000, type: 'general' },
			{ tag: 'male', count: 2000000, type: 'general' },
			{ tag: 'female', count: 3000000, type: 'general' },
			{ tag: 'sex', count: 1500000, type: 'general' },
			{ tag: 'kinktober_2025', count: 500, type: 'general' }
		],
		change: '1761790229',
		comment_count: '0',
		status: 'active',
		source: 'https://bsky.app/profile/sylo-sins.bsky.social/post/3m4ersnwg6g2i'
	}),
	// Post 4: Explicit solo with many tags
	createMockPost({
		id: '15306305',
		height: '3456',
		width: '2688',
		score: '1',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/3559/thumbnail_0d9ec7c239c3ddcca2fa95be46b8aa53.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/3559/0d9ec7c239c3ddcca2fa95be46b8aa53.jpeg',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/3559/sample_0d9ec7c239c3ddcca2fa95be46b8aa53.jpg',
		sample_width: '850',
		sample_height: '1093',
		rating: 'e',
		tags: 'solo ai_generated breasts female highres overwatch pharah night onsen',
		tag_info: [
			{ tag: 'solo', count: 3549227, type: 'general' },
			{ tag: 'ai_generated', count: 50000, type: 'general' },
			{ tag: 'breasts', count: 2000000, type: 'general' },
			{ tag: 'female', count: 3000000, type: 'general' },
			{ tag: 'highres', count: 500000, type: 'meta' },
			{ tag: 'overwatch', count: 200000, type: 'copyright' },
			{ tag: 'pharah', count: 15000, type: 'character' },
			{ tag: 'night', count: 25000, type: 'general' },
			{ tag: 'onsen', count: 8000, type: 'general' }
		],
		change: '1761836154',
		comment_count: '0',
		status: 'active',
		source: 'www.patreon.com/Lewdiboo'
	}),
	// Post 5: Safe-rated landscape
	createMockPost({
		id: '15302745',
		height: '2304',
		width: '1536',
		score: '3',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/2288/thumbnail_2ca7fa674cf2b66fe1e0664a0481f0e6.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/2288/2ca7fa674cf2b66fe1e0664a0481f0e6.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/2288/sample_2ca7fa674cf2b66fe1e0664a0481f0e6.jpg',
		sample_width: '850',
		sample_height: '1275',
		rating: 's',
		tags: 'sfw ai_generated blush breasts smile umamusume clothed',
		tag_info: [
			{ tag: 'sfw', count: 1000000, type: 'general' },
			{ tag: 'ai_generated', count: 50000, type: 'general' },
			{ tag: 'blush', count: 400000, type: 'general' },
			{ tag: 'breasts', count: 2000000, type: 'general' },
			{ tag: 'smile', count: 1564979, type: 'general' },
			{ tag: 'umamusume', count: 30000, type: 'copyright' },
			{ tag: 'clothed', count: 800000, type: 'general' }
		],
		change: '1761798839',
		comment_count: '0',
		status: 'active',
		source: 'https://patreon.com/WixArena'
	}),
	// Post 6: Explicit with dragon/monster content
	createMockPost({
		id: '15293391',
		height: '1502',
		width: '1500',
		score: '3',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/1512/thumbnail_856f516d048de746c4154a32d723594eec1b7b1d.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/1512/856f516d048de746c4154a32d723594eec1b7b1d.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/1512/sample_856f516d048de746c4154a32d723594eec1b7b1d.jpg',
		sample_width: '850',
		sample_height: '851',
		rating: 'e',
		tags: 'scenery anthro dragon male duo sex monster_hunter sunset kinktober_2025',
		tag_info: [
			{ tag: 'scenery', count: 15000, type: 'general' },
			{ tag: 'anthro', count: 500000, type: 'general' },
			{ tag: 'dragon', count: 150000, type: 'species' },
			{ tag: 'male', count: 2000000, type: 'general' },
			{ tag: 'duo', count: 300000, type: 'general' },
			{ tag: 'sex', count: 1500000, type: 'general' },
			{ tag: 'monster_hunter', count: 25000, type: 'copyright' },
			{ tag: 'sunset', count: 12000, type: 'general' },
			{ tag: 'kinktober_2025', count: 500, type: 'general' }
		],
		change: '1761727528',
		comment_count: '0',
		status: 'active',
		source: 'https://bsky.app/profile/did:plc:zg6kh534t42tdxnmwokwp2ui/post/3m4b45ys35y24'
	}),
	// Post 7: Questionable rating
	createMockPost({
		id: '15302733',
		height: '2304',
		width: '1536',
		score: '2',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/2288/thumbnail_750bfff71d3ab51ebaf53fea4055c12f.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/2288/750bfff71d3ab51ebaf53fea4055c12f.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/2288/sample_750bfff71d3ab51ebaf53fea4055c12f.jpg',
		sample_width: '850',
		sample_height: '1275',
		rating: 'q',
		tags: 'sfw ai_generated blush smile standing umamusume looking_at_viewer',
		tag_info: [
			{ tag: 'sfw', count: 1000000, type: 'general' },
			{ tag: 'ai_generated', count: 50000, type: 'general' },
			{ tag: 'blush', count: 400000, type: 'general' },
			{ tag: 'smile', count: 1564979, type: 'general' },
			{ tag: 'standing', count: 200000, type: 'general' },
			{ tag: 'umamusume', count: 30000, type: 'copyright' },
			{ tag: 'looking_at_viewer', count: 600000, type: 'general' }
		],
		change: '1761798742',
		comment_count: '0',
		status: 'active',
		source: 'https://patreon.com/WixArena'
	}),
	// Post 8: Comic with scenery
	createMockPost({
		id: '15295975',
		height: '2699',
		width: '1528',
		score: '1',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/1512/thumbnail_cc7948586604daa06f6b9dc3272722b8dae52053.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/1512/cc7948586604daa06f6b9dc3272722b8dae52053.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/1512/sample_cc7948586604daa06f6b9dc3272722b8dae52053.jpg',
		sample_width: '850',
		sample_height: '1501',
		rating: 'e',
		tags: 'scenery anthro bird comic duo male female sex airship flight_suit',
		tag_info: [
			{ tag: 'scenery', count: 15000, type: 'general' },
			{ tag: 'anthro', count: 500000, type: 'general' },
			{ tag: 'bird', count: 100000, type: 'species' },
			{ tag: 'comic', count: 80000, type: 'general' },
			{ tag: 'duo', count: 300000, type: 'general' },
			{ tag: 'male', count: 2000000, type: 'general' },
			{ tag: 'female', count: 3000000, type: 'general' },
			{ tag: 'sex', count: 1500000, type: 'general' },
			{ tag: 'airship', count: 500, type: 'general' },
			{ tag: 'flight_suit', count: 2000, type: 'general' }
		],
		change: '1761752866',
		comment_count: '0',
		status: 'active',
		source: 'https://www.furaffinity.net/view/62791399/'
	}),
	// Post 9: High score post
	createMockPost({
		id: '15306302',
		height: '4000',
		width: '3000',
		score: '15',
		preview_url:
			'https://api-cdn.rule34.xxx/thumbnails/3559/thumbnail_4403db9728648e7fe68945e9634d1115.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/3559/4403db9728648e7fe68945e9634d1115.png',
		parent_id: '',
		sample_url:
			'https://api-cdn.rule34.xxx/samples/3559/sample_4403db9728648e7fe68945e9634d1115.jpg',
		sample_width: '850',
		sample_height: '1133',
		rating: 'e',
		tags: 'solo female breasts nude pokemon highres nintendo',
		tag_info: [
			{ tag: 'solo', count: 3549227, type: 'general' },
			{ tag: 'female', count: 3000000, type: 'general' },
			{ tag: 'breasts', count: 2000000, type: 'general' },
			{ tag: 'nude', count: 1800000, type: 'general' },
			{ tag: 'pokemon', count: 800000, type: 'copyright' },
			{ tag: 'highres', count: 500000, type: 'meta' },
			{ tag: 'nintendo', count: 900000, type: 'copyright' }
		],
		change: '1761836135',
		comment_count: '5',
		status: 'active',
		source: 'https://x.com/TOFO_U/status/1983820129667584040'
	}),
	// Post 10: Video/animated content (mp4)
	createMockPost({
		id: '15300001',
		height: '1080',
		width: '1920',
		score: '25',
		preview_url: 'https://api-cdn.rule34.xxx/thumbnails/2200/thumbnail_video123.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/2200/video123.mp4',
		parent_id: '',
		sample_url: 'https://api-cdn.rule34.xxx/samples/2200/sample_video123.mp4',
		sample_width: '854',
		sample_height: '480',
		rating: 'e',
		tags: 'solo animated video sound 3d sfm source_filmmaker',
		tag_info: [
			{ tag: 'solo', count: 3549227, type: 'general' },
			{ tag: 'animated', count: 300000, type: 'meta' },
			{ tag: 'video', count: 250000, type: 'meta' },
			{ tag: 'sound', count: 224664, type: 'meta' },
			{ tag: '3d', count: 400000, type: 'meta' },
			{ tag: 'sfm', count: 100000, type: 'meta' },
			{ tag: 'source_filmmaker', count: 124910, type: 'meta' }
		],
		change: '1761700000',
		comment_count: '12',
		status: 'active',
		source: 'https://example.com/animator'
	}),
	// Post 11: GIF animation
	createMockPost({
		id: '15299999',
		height: '600',
		width: '800',
		score: '18',
		preview_url: 'https://api-cdn.rule34.xxx/thumbnails/2199/thumbnail_anim456.jpg',
		file_url: 'https://api-cdn.rule34.xxx/images/2199/anim456.gif',
		parent_id: '',
		sample_url: 'https://api-cdn.rule34.xxx/images/2199/anim456.gif',
		sample_width: '800',
		sample_height: '600',
		rating: 'q',
		tags: 'solo animated gif loop bounce smile winking',
		tag_info: [
			{ tag: 'solo', count: 3549227, type: 'general' },
			{ tag: 'animated', count: 300000, type: 'meta' },
			{ tag: 'gif', count: 150000, type: 'meta' },
			{ tag: 'loop', count: 50000, type: 'meta' },
			{ tag: 'bounce', count: 30000, type: 'general' },
			{ tag: 'smile', count: 1564979, type: 'general' },
			{ tag: 'winking', count: 20000, type: 'general' }
		],
		change: '1761698000',
		comment_count: '7',
		status: 'active',
		source: ''
	})
];

// Filtered collections for specific test scenarios
export const mockSafePosts = mockPosts.filter((p) => p.rating === 's');
export const mockPostsWithComments = mockPosts.filter((p) => parseInt(p.comment_count) > 0);
export const mockVideoPost = mockPosts.find((p) => p.file_url.endsWith('.mp4'));
export const mockGifPost = mockPosts.find((p) => p.file_url.endsWith('.gif'));

export const mockSinglePost = mockPosts[0];
