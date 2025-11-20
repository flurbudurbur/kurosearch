import { describe, it, expect } from 'vitest';
import { replaceHtmlEntities } from '$lib/logic/replace-html-entities';

describe('replace-html-entities', () => {
	it('replaces known entities', () => {
		const input = 'Tom &#034;O&#039;Connor&#034; &eacute;lan &#038; co';
		const out = replaceHtmlEntities(input);
		expect(out).toBe('Tom "O\'Connor" élan & co');
	});

	it('passes through strings without those entities', () => {
		const input = 'plain text 123';
		expect(replaceHtmlEntities(input)).toBe(input);
	});
});
