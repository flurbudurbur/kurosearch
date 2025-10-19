<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import AccountLink from '$lib/components/kurosearch/link-account/AccountLink.svelte';
	import DiscordLink from '$lib/components/kurosearch/link-discord/DiscordLink.svelte';
	import SettingsLink from '$lib/components/kurosearch/settings-link/SettingsLink.svelte';
	import CodiconLink from '$lib/components/pure/icon-link/CodiconLink.svelte';
	import KurosearchTitle from '$lib/components/kurosearch/kurosearch-title/KurosearchTitle.svelte';
	import { SPONSOR_URL } from '$lib/logic/app-config';

	interface Props {
		showLogo?: boolean;
	}

	let { showLogo = $bindable(false) }: Props = $props();

	const userPhoto: string | undefined = undefined;

	let lastScrollY = $state(0);
	let hideNav = $state(false);
	let scrolled = $state(false);

	// Hide nav on scroll down, show on scroll up
	$effect(() => {
		if (browser) {
			const handleScroll = () => {
				const currentScrollY = window.scrollY;

				// Show logo in nav when scrolled down more than 100px
				scrolled = currentScrollY > 100;
				showLogo = scrolled;

				// Only hide nav if scrolled down more than 10px
				if (currentScrollY < 10) {
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
		<CodiconLink title="Sponsor" href={SPONSOR_URL} icon="codicon codicon-heart" newtab />
		<DiscordLink />
		<CodiconLink title="Documentation" href={resolve('/help')} icon="codicon codicon-book" />
		{#if scrolled}
			<div class="logo-container">
				<KurosearchTitle />
			</div>
		{:else}
			<div class="spacer"></div>
		{/if}
		<CodiconLink title="Search" href={resolve('/')} icon="codicon codicon-search" />
		<CodiconLink title="Saved Posts" href={resolve('/saved')} icon="codicon codicon-notebook" />
		<SettingsLink />
		<AccountLink src={userPhoto} />
	</nav>
</header>

<style lang="scss">
	.logo-container {
		display: flex;
		align-items: center;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		flex-grow: 1;
	}

	.spacer {
		flex-grow: 1;
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
