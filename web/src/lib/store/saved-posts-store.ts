import { StoreKey } from '$lib/store/store-keys';
import { persistentWritable } from '$lib/store/persistent-store';

export type SavedPostsStore = {
	posts: kurosearch.SavedPost[];
};

const getInitial = (): SavedPostsStore => ({
	posts: []
});

const createSavedPostsStore = () => {
	const { subscribe, update, set } = persistentWritable(StoreKey.SavedPosts, getInitial());

	return {
		subscribe,
		set,
		add(post: kurosearch.SavedPost) {
			update((previous) => {
				if (previous.posts.some((p) => p.id === post.id)) {
					return previous;
				}
				return {
					...previous,
					posts: [...previous.posts, post]
				};
			});
		},
		remove(post: kurosearch.SavedPost) {
			update((previous) => ({
				...previous,
				posts: previous.posts.filter((p) => p.id !== post.id)
			}));
		},
		reset() {
			set(getInitial());
		}
	};
};

export default createSavedPostsStore();
