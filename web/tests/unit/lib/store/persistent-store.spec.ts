import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getValue } from '../../../helpers/getValue';

// Helpers to load fresh module with mocked environment
const loadModule = async (browser: boolean) => {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ browser }));
	return await import('$lib/store/persistent-store');
};

describe('persistent-store', () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	it('returns initial value and does not write when browser=false', async () => {
		const mod = await loadModule(false);
		const spySet = vi.spyOn(window.localStorage, 'setItem');
		const store = mod.persistentWritable('k', { a: 1 });
		const value = await getValue<{ a: number }>(store);
		expect(value).toEqual({ a: 1 });
		store.set({ a: 2 });
		expect(spySet).not.toHaveBeenCalled();
	});

	it('loads from localStorage when browser=true and getItem is null (uses initial)', async () => {
		const mod = await loadModule(true);
		const getSpy = vi.spyOn(window.localStorage, 'getItem');
		getSpy.mockImplementation((_key: string) => null);
		const store = mod.persistentWritable('k', { a: 1 });
		const value = await getValue<{ a: number }>(store);
		expect(value).toEqual({ a: 1 });
	});

	it('writes to localStorage on set with default serializer', async () => {
		const mod = await loadModule(true);
		const store = mod.persistentWritable('k', { a: 1 });
		store.set({ a: 42 });
		expect(window.localStorage.getItem('k')).toBe(JSON.stringify({ a: 42 }));
	});

	it('merges objects when parser returns object (default JSON parser)', async () => {
		const mod = await loadModule(true);
		window.localStorage.setItem('k', JSON.stringify({ b: 2 }));
		const store = mod.persistentWritable('k', { a: 1 } as any);
		const value = await getValue<any>(store);
		expect(value).toEqual({ a: 1, b: 2 });
	});

	it('returns primitive when parser returns primitive', async () => {
		const mod = await loadModule(true);
		window.localStorage.setItem('k', '5');
		const store = mod.persistentWritable('k', 1);
		const value = await getValue<number>(store);
		expect(value).toBe(5);
	});

	it('falls back to initial when parser returns undefined', async () => {
		const mod = await loadModule(true);
		vi.spyOn(window.localStorage, 'getItem').mockReturnValue('whatever');
		const parser = vi.fn(() => undefined);
		const store = mod.persistentWritable('k', 7, mod.defaultSerializer, parser);
		const value = await getValue<number>(store);
		expect(value).toBe(7);
	});

	it('falls back to initial on parser error', async () => {
		const mod = await loadModule(true);
		vi.spyOn(window.localStorage, 'getItem').mockReturnValue('invalid-json');
		const parser = vi.fn(() => {
			throw new Error('boom');
		});
		const store = mod.persistentWritable('k', { a: 1 }, mod.defaultSerializer, parser);
		const value = await getValue<{ a: number }>(store);
		expect(value).toEqual({ a: 1 });
	});

	it('uses custom serializer', async () => {
		const mod = await loadModule(true);
		const serializer = (v: any) => `v=${v}`;
		const store = mod.persistentWritable('k', 0, serializer, mod.defaultParser);
		store.set(9);
		expect(window.localStorage.getItem('k')).toBe('v=9');
	});

	it('boolParser and boolSerializer work correctly', async () => {
		const mod = await loadModule(true);
		expect(mod.boolParser('TrUe')).toBe(true);
		expect(mod.boolParser('false')).toBe(false);
		expect(mod.boolSerializer(true)).toBe('true');
	});

	it('stringParser and stringSerializer work correctly', async () => {
		const mod = await loadModule(true);
		expect(mod.stringParser('abc')).toBe('abc');
		expect(mod.stringSerializer('abc')).toBe('abc');
	});
});
