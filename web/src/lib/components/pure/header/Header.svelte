<script lang="ts">
	import { resolve } from '$app/paths';
	import DiscordLink from '$lib/components/kurosearch/link-discord/DiscordLink.svelte';
	import IconLink from '$lib/components/pure/icon-link/IconLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { SPONSOR_URL } from '$lib/logic/app-config';
	import KurosearchTitle from '$lib/components/kurosearch/kurosearch-title/KurosearchTitle.svelte';
	import { useScrollTracking } from '$lib/logic/scroll-tracking.svelte';

	interface Props {
		searchFormVisible?: boolean;
	}

	let { searchFormVisible = true }: Props = $props();

	// Track scroll position and direction
	const scroll = useScrollTracking({ hideThreshold: 10 });

	// Don't hide the navbar while the search form is still visible
	const hideNav = $derived(scroll.shouldHide && !searchFormVisible);
</script>

<header class:hide={hideNav}>
	<nav aria-label="Main navigation">
		<IconLink title="Ko-Fi" href={SPONSOR_URL} newtab>
			<Icon icon="coffee" />
		</IconLink>
		<DiscordLink />
		<IconLink title="Documentation" href={resolve('/help')} preload>
			<Icon icon="book" />
		</IconLink>
		<div class="spacer">
			<KurosearchTitle />
		</div>
		<IconLink title="Search" href={resolve('/')} preload>
			<Icon icon="home" />
		</IconLink>
		<IconLink title="Saved Posts" href={resolve('/saved')} preload>
			<Icon icon="bookmarks" />
		</IconLink>
		<IconLink title="Settings" href={resolve('/preferences')} preload>
			<Icon icon="settings" />
		</IconLink>
		<IconLink title="Account" href={resolve('/account')} preload>
			<Icon icon="user-circle" />
		</IconLink>
	</nav>
</header>

<style lang="scss">
	.spacer {
		flex-grow: 1;
		display: flex;
		place-content: center;
		position: relative;
	}

	header {
		position: sticky;
		top: 0;
		z-index: 100;
		transition:
			transform 0.3s ease-in-out,
			background-color var(--default-transition-behaviour);
		transform: translateY(0);
		background-color: var(--background-0);
		padding: var(--grid-gap);
		width: 100%;
		display: flex;
		justify-content: center;

		&.hide {
			transform: translateY(-100%);
		}

		@media (max-width: 768px) {
			display: none;
		}
	}

	nav {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		max-width: 800px;
	}
</style>
