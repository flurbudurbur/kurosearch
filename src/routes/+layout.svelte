<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import TermsOfUseDialog from '$lib/components/kurosearch/dialog-terms-of-use/CookieMessage.svelte';
	import IconTextLink from '$lib/components/pure/icon-link/IconTextLink.svelte';
	import Header from '$lib/components/pure/header/Header.svelte';
	import theme from '$lib/store/theme-store';
	import wideLayoutEnabled from '$lib/store/wide-layout-enabled-store';
	import { blurEnabled } from '$lib/store/blur-enabled-store';
	import { SOURCE_CODE_URL } from '$lib/logic/app-config';

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

	const year = new Date().getFullYear();

	let showLogoInNav = $state(false);
	let searchFormVisible = $state(true);

	theme.subscribe((value) => {
		if (browser) {
			const [accent, theme] = value.split(' ');
			document.documentElement.dataset.theme = theme;
			document.documentElement.dataset.accent = accent;
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
						showLogoInNav = !entry.isIntersecting;
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
</script>

<svelte:head>
	<link rel="preconnect" href="https://api.rule34.xxx" />
	<link rel="preconnect" href="https://us.rule34.xxx" />
	<script lang="ts">
		const [accent, theme] = (localStorage.getItem('kurosearch:theme') ?? 'crimson dark').split(' ');
		document.documentElement.dataset.theme = theme;
		document.documentElement.dataset.accent = accent;
	</script>
</svelte:head>

<TermsOfUseDialog />

<a href="#main-content" class="skip-link">Skip to main content</a>

<Header {searchFormVisible} />

<!-- Spacer for hero logo so content doesn't overlap -->
<div class="logo-spacer"></div>

<main id="main-content" class:extra-wide={$wideLayoutEnabled && page.url.pathname === '/'}>
	{@render children?.()}
</main>

<footer>
	<section class="footer">
		<span class="stacked-tags">
			<IconTextLink
				title="Source Code"
				href="https://github.com/kurozenzen/kurosearch"
				icon="brand-github"
				label="Github KuroSearch"
				newtab
			/>
			<IconTextLink
				title="Source Code Docker"
				href={SOURCE_CODE_URL}
				icon="brand-github"
				label="Github KuroSearch Docker"
				newtab
			/>
		</span>

		<span class="copyright">&copy; {year} kurozenzen</span>

		<span class="stacked-tags">
			<IconTextLink title="About" href={resolve('/about')} icon="info-circle" label="About" />
			<IconTextLink
				title="Instances"
				href={resolve('/instances')}
				icon="server"
				label="Instances"
			/>
		</span>
	</section>
	<p>
		I do not own the rights to Helheim Lynx and this site is in no way endorsed by, affiliated with,
		or in any other way connected to them.
	</p>
</footer>

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
	}

	:global(body) {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		width: 100%;
		align-items: center;
		overflow-y: scroll;
	}

	.stacked-tags {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.footer {
		display: flex;
		align-items: flex-start;
	}

	footer section {
		display: flex;
		gap: 8px;
	}

	main {
		width: 100%;
		flex-grow: 1;
		max-width: var(--body-width);
	}

	main.extra-wide {
		max-width: 90vw;
	}

	footer {
		padding: var(--grid-gap);
	}

	footer section {
		color: var(--text-muted);
		justify-content: space-between;
	}

	div {
		flex-grow: 1;
	}

	span {
		font-size: var(--text-size-small);
	}

	footer {
		width: 100%;
		max-width: calc(var(--body-width) + 2 * var(--grid-gap));
	}

	footer {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
	}

	p {
		font-size: var(--text-size-small);
		text-align: center;
		color: var(--text-muted);
	}
</style>
