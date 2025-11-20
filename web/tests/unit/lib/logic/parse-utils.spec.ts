import { describe, it, expect } from 'vitest';
import { parseXml, parseJson } from '$lib/logic/parse-utils';
import { makeResponse } from '../../../setup/mocks/fetch';

describe('parse-utils', () => {
	describe('parseXml', () => {
		it('strips BOM and leading garbage before first tag', () => {
			const xml = parseXml('\uFEFFgarbage text before<root><child/></root>');
			const roots = xml.getElementsByTagName('root');
			expect(roots.length).toBe(1);
			expect(roots[0].getElementsByTagName('child').length).toBe(1);
		});
	});

	describe('parseJson', () => {
		it('parses valid json via response.clone().json', async () => {
			const r = makeResponse({ json: { ok: true, n: 1 } });
			const obj = await parseJson(r);
			expect(obj).toEqual({ ok: true, n: 1 });
		});

		it('falls back to cleaning text when json parsing fails (BOM and junk prefix)', async () => {
			const r = makeResponse({ text: '\uFEFFjunk[[{"a":1}],{"b":2}]' });
			const obj = await parseJson(r);
			expect(obj).toEqual([[{ a: 1 }], { b: 2 }]);
		});
	});
});
