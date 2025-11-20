import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type SerializerFn<T> = (value: T) => string;
export type ParserFn<T> = (value: string) => T | undefined;

export const defaultParser = JSON.parse;
export const defaultSerializer = JSON.stringify;

export const boolParser = (value: string) => value.toLowerCase() === 'true';
export const boolSerializer = (value: boolean) => value.toString();

export const stringParser = (value: string) => value;
export const stringSerializer = (value: string) => value;

export const persistentWritable = <T>(
	key: string,
	initial: T,
	serializer: SerializerFn<T> = defaultSerializer,
	parser: ParserFn<T> = defaultParser
) => {
	const stored = browser ? window.localStorage.getItem(key) : null;
	const value = getInitialValue(stored, initial, parser);
	const store = writable(value);

	return {
		subscribe: store.subscribe,
		set: (v: T) => {
			store.set(v);
			if (browser) {
				window.localStorage.setItem(key, serializer(v));
			}
		},
		update: (fn: (v: T) => T) => {
			store.update((cur) => {
				const v = fn(cur);
				if (browser) {
					window.localStorage.setItem(key, serializer(v));
				}
				return v;
			});
		}
	};
};

const getInitialValue = <T>(stored: string | null, initial: T, parser: ParserFn<T>): T => {
	if (stored === null) {
		return initial;
	}

	try {
		const result = parser(stored);
		if (result === undefined) {
			return initial;
		}

		if (typeof result === 'object' && typeof initial === 'object') {
			return { ...initial, ...result };
		}

		return result;
	} catch {
		return initial;
	}
};
