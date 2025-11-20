import { persistentWritable } from './persistent-store';
import { StoreKey } from './store-keys';

/**
 * Valid column count values for the results grid
 */
export type ResultColumns = '1' | '2' | '3' | '4' | '5' | '6';

const createResultColumnsStore = () => {
	const initial: ResultColumns = '1';
	const { subscribe, set } = persistentWritable<ResultColumns>(StoreKey.ResultColumns, initial);
	return { subscribe, set, reset: () => set(initial) };
};

export default createResultColumnsStore();
