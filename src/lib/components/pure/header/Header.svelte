<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import AccountLink from '$lib/components/kurosearch/link-account/AccountLink.svelte';
	import DiscordLink from '$lib/components/kurosearch/link-discord/DiscordLink.svelte';
	import SettingsLink from '$lib/components/kurosearch/settings-link/SettingsLink.svelte';
	import IconLink from '$lib/components/pure/icon-link/IconLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { SPONSOR_URL } from '$lib/logic/app-config';
	import KurosearchTitle from '$lib/components/kurosearch/kurosearch-title/KurosearchTitle.svelte';

	interface Props {
		searchFormVisible?: boolean;
	}

	let { searchFormVisible = true }: Props = $props();

	const userPhoto: string | undefined = undefined;

	let lastScrollY = $state(0);
	let hideNav = $state(false);

	// Hide nav on scroll down, show on scroll up
	$effect(() => {
		if (browser) {
			const handleScroll = () => {
				const currentScrollY = window.scrollY;

				// Only hide nav if scrolled down more than 10px
				if (currentScrollY < 10) {
					hideNav = false;
				} else if (searchFormVisible) {
					// Don't hide the navbar while the search form is still visible
					hideNav = false;
				} else {
					hideNav = currentScrollY > lastScrollY;
				}

				lastScrollY = currentScrollY;
			};

			window.addEventListener('scroll', handleScroll, { passive: true });

			return () => {
				window.removeEventListener('scroll', handleScroll);
			};
		}
	});
</script>

<header class:hide={hideNav}>
	<nav aria-label="Main navigation">
		<IconLink title="Ko-Fi" href={SPONSOR_URL} newtab>
			<Icon icon="coffee" />
		</IconLink>
		<DiscordLink />
		<IconLink title="Documentation" href={resolve('/help')}>
			<Icon icon="book" />
		</IconLink>
		<div class="spacer">
			<KurosearchTitle />
		</div>
		<IconLink title="Search" href={resolve('/')}>
			<Icon icon="home" />
		</IconLink>
		<IconLink title="Saved Posts" href={resolve('/saved')}>
			<Icon icon="bookmarks" />
		</IconLink>
		<SettingsLink />
		<AccountLink src={userPhoto} />
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
		transition: transform 0.3s ease-in-out;
		transform: translateY(0);
		background-color: var(--background-0);
		padding: var(--grid-gap);
		width: 100%;
		max-width: calc(var(--body-width) + 2 * var(--grid-gap));

		&.hide {
			transform: translateY(-100%);
		}
	}

	nav {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
