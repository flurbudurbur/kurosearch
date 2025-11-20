import { pushState } from '$app/navigation';

export interface Parameters {
	hash: string;
	onPopState: () => void;
}

export const onpopstate = (_node: HTMLElement, onPopState: () => void) => {
	window.addEventListener('popstate', onPopState);

	return {
		destroy() {
			window.removeEventListener('popstate', onPopState);
		}
	};
};

export const addHistory = (state: string) => {
	pushState('', { state });
};
