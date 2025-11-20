import { boolParser, boolSerializer, persistentWritable } from './persistent-store';
import { StoreKey } from './store-keys';

const createLocalStorageEnabledStore = () => {
	const initial = false;
	const { subscribe, set } = persistentWritable(
		StoreKey.LocalstorageEnabled,
		initial,
		boolSerializer,
		boolParser
	);
	return { subscribe, set, reset: () => set(initial) };
};

export default createLocalStorageEnabledStore();
