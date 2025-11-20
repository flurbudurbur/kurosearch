import { getContext, setContext } from 'svelte';

interface PostDetailsContext {
	post: kurosearch.Post;
	links: number;
	activeTab: string | undefined;
	overflowOpen: boolean;
	selectTab: (tab: string) => void;
	toggleOverflow: () => void;
}

const POST_DETAILS_KEY = Symbol('post-details');

export function setPostDetailsContext(context: PostDetailsContext) {
	setContext(POST_DETAILS_KEY, context);
}

export function getPostDetailsContext(): PostDetailsContext {
	return getContext(POST_DETAILS_KEY);
}
