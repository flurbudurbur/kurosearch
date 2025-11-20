<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import TermsOfUseDialog from '$lib/components/kurosearch/dialog-terms-of-use/CookieMessage.svelte';
	import Header from '$lib/components/pure/header/Header.svelte';
	import Footer from '$lib/components/pure/footer/Footer.svelte';
	import theme from '$lib/store/theme-store';
	import { blurEnabled } from '$lib/store/blur-enabled-store';
	import resultColumns from '$lib/store/result-columns-store';
	import logo from '$lib/assets/logo.svg?raw';

	import './defaults.scss';
	import './fonts.scss';
	import './global.scss';
	import './reset.scss';
	import './scrollbar.scss';
	import './theme.scss';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let searchFormVisible = $state(true);
	let MobileNav: Component | undefined = $state(undefined);

	theme.subscribe((value) => {
		if (browser) {
			const [accent, theme] = value.split(' ');
			document.documentElement.dataset.theme = theme;
			document.documentElement.dataset.accent = accent;
		}
	});

	// Initialize cookies attribute on first load
	$effect(() => {
		if (browser) {
			const cookies = localStorage.getItem('kurosearch:cookies-accepted') ?? 'false';
			document.documentElement.dataset.cookies = cookies;
		}
	});

	// Watch for URL parameter changes to enable/disable blur
	$effect(() => {
		if (browser) {
			const shouldBlur = page.url.searchParams.has('blur');
			blurEnabled.set(shouldBlur);
		}
	});

	// Track SearchForm visibility to show/hide logo in navbar
	$effect(() => {
		if (browser) {
			const searchForm = document.getElementById('search');
			if (!searchForm) return;

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						searchFormVisible = entry.isIntersecting;
					});
				},
				{
					threshold: 0,
					rootMargin: '0px'
				}
			);

			observer.observe(searchForm);

			return () => {
				observer.disconnect();
			};
		}
	});

	// Lazy-load MobileNav only on mobile viewports
	$effect(() => {
		if (browser && !MobileNav && window.innerWidth <= 768) {
			(async () => {
				const module = await import('$lib/components/kurosearch/mobile-nav/MobileNav.svelte');
				MobileNav = module.default;
			})();
		}
	});
</script>

<svelte:head>
	<!-- Preload critical fonts for better performance -->
	<link
		rel="preload"
		href="/font/BricolageGrotesque-VariableFont.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="/font/Roboto-Regular.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>

	<!-- Preconnect to external API domains -->
	<link rel="preconnect" href="https://api.rule34.xxx" />
	<link rel="preconnect" href="https://us.rule34.xxx" />

	<script lang="ts">
		const [accent, theme] = (localStorage.getItem('kurosearch:theme') ?? 'crimson dark').split(' ');
		document.documentElement.dataset.theme = theme;
		document.documentElement.dataset.accent = accent;

		const cookies = localStorage.getItem('kurosearch:cookies-accepted') ?? 'false';
		document.documentElement.dataset.cookies = cookies;
	</script>
</svelte:head>

<TermsOfUseDialog />

<a href="#main-content" class="skip-link">Skip to main content</a>

<Header {searchFormVisible} />

{#if MobileNav}
	<MobileNav />
{/if}

<!-- Spacer for hero logo so content doesn't overlap -->
<div class="logo-spacer">
	<div class="mobile-logo">
		{@html logo}
	</div>
</div>

<main id="main-content" class:wide={parseInt($resultColumns) > 1 && page.url.pathname === '/'}>
	{@render children?.()}
</main>

<Footer />

<style lang="scss">
	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		background: var(--accent);
		color: var(--text-accent);
		padding: 8px;
		text-decoration: none;
		z-index: 9999;
		border-radius: var(--border-radius);
	}

	.skip-link:focus {
		top: 8px;
		left: 8px;
	}

	.logo-spacer {
		/* Height to accommodate the hero logo at 3x scale (32px * 3 = 96px) + subtitle (~24px) + gap (0.5rem) + offset (94px) */
		height: 150px;
		width: 100%;
		position: relative;

		@media (max-width: 768px) {
			height: auto;
			display: flex;
			align-items: center;
			justify-content: center;
			padding-top: 40px;
		}
	}

	.mobile-logo {
		display: none;

		@media (max-width: 768px) {
			display: flex;
			place-content: center;

			:global(svg) {
				width: 240px;
				height: 64px;
				will-change: color;
				color: var(--accent-color);
				transition: color 300ms ease-out;
			}
		}
	}

	:global(body) {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		width: 100%;
		align-items: center;
		overflow-y: scroll;
	}

	main {
		width: 100%;
		flex-grow: 1;
		max-width: var(--body-width);
	}

	main.wide {
		max-width: 100%;
	}
</style>
