<script lang="ts">
	import { resolve } from '$app/paths';
	import { getContext } from 'svelte';
	import IconTextLink from '$lib/components/pure/icon-link/IconTextLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { SOURCE_CODE_URL } from '$lib/logic/app-config';

	const year = new Date().getFullYear();
	const openChangelog = getContext<() => void>('openChangelog');
</script>

<footer>
	<section>
		<span class="stacked-tags">
			<IconTextLink
				title="Source Code flur34"
				href={SOURCE_CODE_URL}
				icon="brand-github"
				label="Github flur34"
				newtab
			/>
			<IconTextLink
				title="Source Code"
				href="https://github.com/kurozenzen/kurosearch"
				icon="brand-github"
				label="Github KuroSearch"
				newtab
			/>
		</span>

		<span class="copyright">&copy; {year} kurozenzen, flurbudurbur</span>

		<span class="stacked-tags">
			<IconTextLink title="About" href={resolve('/about')} icon="info-circle" label="About" />
			<IconTextLink
				title="Instances"
				href={resolve('/instances')}
				icon="server"
				label="Instances"
			/>
			<button class="changelog-link" title="What's New" onclick={() => openChangelog?.()}>
				<Icon icon="notebook" />
				What's New
			</button>
		</span>
	</section>
	<p>
		I do not own the rights to Helheim Lynx and this site is in no way endorsed by, affiliated with,
		or in any other way connected to them.
	</p>
</footer>

<style lang="scss">
	$mobile-breakpoint: 768px;
	$mobile-nav-height: 60px;

	footer {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
		padding: var(--grid-gap);
		width: 100%;
		max-width: calc(var(--body-width) + 2 * var(--grid-gap));

		@media (max-width: $mobile-breakpoint) {
			padding-bottom: calc($mobile-nav-height + 1rem);
		}
	}

	section {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 3rem;
		color: var(--text-muted);

		@media (max-width: $mobile-breakpoint) {
			display: none;
		}
	}

	p {
		font-size: var(--text-size-small);
		text-align: center;
		color: var(--text-muted);
		margin-bottom: 1em;
	}

	span {
		font-size: var(--text-size-small);

		&.copyright {
			text-align: center;
		}
	}

	.stacked-tags {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;

		:global(a),
		button {
			width: fit-content;
		}

		&:last-child {
			align-items: flex-end;

			:global(a),
			button {
				flex-direction: row-reverse;
			}
		}
	}

	.changelog-link {
		display: inline-flex;
		align-items: center;
		gap: var(--tiny-gap);
		padding: 4px 8px;
		min-height: 24px;
		color: currentColor;
		font: inherit;
		font-size: var(--text-size-small);
		text-transform: capitalize;
		background: none;
		border: none;
		border-radius: var(--border-radius);
		cursor: pointer;

		@media (hover: hover) {
			transition: color var(--default-transition-behaviour);

			&:hover {
				color: var(--text-highlight);
			}
		}
	}
</style>
