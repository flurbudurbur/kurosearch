/**
 * Mock comment data for integration tests
 * Based on real Rule34 API comment response structures
 */

export const createMockCommentsXml = (postId: string, commentCount: number = 3): string => {
	const comments = Array.from({ length: commentCount }, (_, i) => {
		const creators = [
			'PPSSPPGamer',
			'lomsino',
			'DOOM2',
			'Schoolslut2',
			'TallBlondey',
			'FreeFemWhore',
			'The_Salesman',
			'topscmere',
			'Fatdad',
			'Discord_BBC'
		];
		const bodies = [
			'Great art!',
			'This is amazing work',
			'Love the detail here',
			'Beautiful composition',
			'Incredible rendering',
			'The colors are perfect',
			'Fantastic job on the lighting',
			'This is one of my favorites',
			'Really captures the mood',
			'Absolutely stunning'
		];
		const creator = creators[i % creators.length];
		const body = bodies[i % bodies.length];
		const timestamp = new Date(Date.now() - i * 3600000)
			.toISOString()
			.slice(0, 19)
			.replace('T', ' ');
		const commentId = 33060758 + i;
		const creatorId = 3816899 + i * 1000;

		return `	<comment created_at="${timestamp}" post_id="${postId}" body="${body}" creator="${creator}" id="${commentId}" creator_id="${creatorId}"/>`;
	}).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<comments type="array">
${comments}
</comments>`;
};

export const mockCommentsXml = createMockCommentsXml('1', 3);

export const mockEmptyCommentsXml = `<?xml version="1.0" encoding="UTF-8"?>
<comments type="array">
</comments>`;

/**
 * More realistic comment XML with varied content
 */
export const mockManyCommentsXml = createMockCommentsXml('15306305', 10);

export const mockSingleCommentXml = `<?xml version="1.0" encoding="UTF-8"?>
<comments type="array">
	<comment created_at="2025-10-30 15:57" post_id="15305109" body="Wow, this looks amazing!" creator="art_lover_99" id="33060758" creator_id="3816899"/>
</comments>`;

/**
 * Comments with special characters and HTML entities
 */
export const mockCommentsWithSpecialChars = `<?xml version="1.0" encoding="UTF-8"?>
<comments type="array">
	<comment created_at="2025-10-30 15:57" post_id="1" body="I &lt;3 this! It's &quot;amazing&quot; &amp; beautiful" creator="user_123" id="33060758" creator_id="3816899"/>
	<comment created_at="2025-10-30 15:56" post_id="1" body="Check out this link: https://example.com/art
Multi-line comment test" creator="linksharer" id="33060759" creator_id="3816900"/>
	<comment created_at="2025-10-30 15:55" post_id="1" body="[b]Bold text test[/b] and [i]italic test[/i]" creator="formatter" id="33060760" creator_id="3816901"/>
</comments>`;
