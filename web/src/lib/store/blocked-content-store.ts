import { persistentWritable } from './persistent-store';
import { StoreKey } from './store-keys';

const getInitial = (): Record<kurosearch.BlockingGroup, boolean> => ({
	'AI-Generated': true,
	'Animal-Related': false,
	'Non-Consensual': false,
	Gore: false,
	Scat: false,
	Vore: false,
	Yaoi: false,
	Yuri: false
});

const createBlockedContentStore = () => {
	const { subscribe, set } = persistentWritable(StoreKey.BlockedContent, getInitial());

	return {
		subscribe,
		set,
		reset: () => set(getInitial())
	};
};

export default createBlockedContentStore();
