<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import IconLink from '$lib/components/pure/icon-link/IconLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import SettingsLink from '$lib/components/kurosearch/settings-link/SettingsLink.svelte';
	import AccountLink from '$lib/components/kurosearch/link-account/AccountLink.svelte';
	import { SOURCE_CODE_URL } from '$lib/logic/app-config';

	interface Props {
		userPhoto?: string;
	}

	let { userPhoto }: Props = $props();

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function isActive(href: string): boolean {
		// Handle root path specially
		if (href === resolve('/')) {
			return page.url.pathname === resolve('/');
		}
		return page.url.pathname.startsWith(href);
	}

	function handleHomeClick(event: MouseEvent) {
		const isOnHomePage = page.url.pathname === resolve('/');
		if (isOnHomePage) {
			event.preventDefault();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		closeMenu();
	}

	// Close menu when route changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		page.url.pathname;
		menuOpen = false;
	});
</script>

<nav class="mobile-nav" aria-label="Mobile navigation">
	<!-- Bottom Bar with Priority Icons -->
	<div class="bottom-bar">
		<AccountLink src={userPhoto} preload onclick={closeMenu} />
		<SettingsLink preload onclick={closeMenu} />
		<IconLink
			title="Search"
			href={resolve('/')}
			preload
			onclick={handleHomeClick}
			class={isActive(resolve('/')) ? 'active' : ''}
		>
			<Icon icon="home" />
		</IconLink>
		<IconLink
			title="Saved Posts"
			href={resolve('/saved')}
			preload
			onclick={closeMenu}
			class={isActive(resolve('/saved')) ? 'active' : ''}
		>
			<Icon icon="bookmarks" />
		</IconLink>
		<button
			class="hamburger"
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			aria-expanded={menuOpen}
			onclick={toggleMenu}
		>
			<Icon icon={menuOpen ? 'x' : 'menu-2'} size="2em" />
		</button>
	</div>

	<!-- Overflow Menu -->
	{#if menuOpen}
		<div
			class="menu-overlay"
			role="button"
			tabindex="0"
			onclick={closeMenu}
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? closeMenu() : null)}
		></div>
		<div class="overflow-menu">
			<IconLink
				title="Documentation"
				href={resolve('/help')}
				preload
				onclick={closeMenu}
				class={isActive(resolve('/help')) ? 'active' : ''}
			>
				<Icon icon="book" />
				<span>Documentation</span>
			</IconLink>
			<IconLink
				title="Discord"
				href="https://discord.com/invite/x2jZPyFhPS"
				newtab
				onclick={closeMenu}
			>
				<Icon icon="brand-discord" />
				<span>Discord</span>
			</IconLink>
			<IconLink
				title="Support on Ko-Fi"
				href="https://ko-fi.com/kurozenzen"
				newtab
				onclick={closeMenu}
			>
				<Icon icon="coffee" />
				<span>Support</span>
			</IconLink>
			<IconLink
				title="About"
				href={resolve('/about')}
				onclick={closeMenu}
				class={isActive(resolve('/about')) ? 'active' : ''}
			>
				<Icon icon="info-circle" />
				<span>About</span>
			</IconLink>
			<IconLink
				title="Instances"
				href={resolve('/instances')}
				onclick={closeMenu}
				class={isActive(resolve('/instances')) ? 'active' : ''}
			>
				<Icon icon="server" />
				<span>Instances</span>
			</IconLink>
			<IconLink title="Source Code" href={SOURCE_CODE_URL} onclick={closeMenu} newtab>
				<Icon icon="brand-github" />
				<span>Source Code</span>
			</IconLink>
		</div>
	{/if}
</nav>

<style lang="scss">
	.mobile-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 200;
		display: none;

		@media (max-width: 768px) {
			display: block;
		}
	}

	.bottom-bar {
		display: flex;
		align-items: center;
		justify-content: space-around;
		background-color: var(--background-0);
		padding: 8px;
		gap: 4px;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

		:global(a.active) {
			background-color: var(--background-1);
			color: var(--text-highlight);
		}
	}

	.hamburger {
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px;
		display: flex;
		place-content: center;
		color: var(--text);
		border-radius: var(--border-radius);
		transition: background-color 0.2s;

		&:hover {
			background-color: var(--background-1);
		}

		&:active {
			background-color: var(--background-2);
		}
	}

	.menu-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 199;
	}

	.overflow-menu {
		position: fixed;
		bottom: 60px;
		right: 8px;
		background-color: var(--background-0);
		border: 1px solid var(--background-2);
		border-radius: var(--border-radius);
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		z-index: 201;
		min-width: 200px;

		:global(a) {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			flex-direction: row-reverse;
			gap: 12px;
			padding: 12px;
			border-radius: var(--border-radius);
			text-decoration: none;
			color: var(--text);
			transition: background-color 0.2s;

			&:hover {
				background-color: var(--background-1);
			}

			&:active {
				background-color: var(--background-2);
			}
		}

		span {
			font-size: var(--text-size-normal);
		}
	}
</style>
