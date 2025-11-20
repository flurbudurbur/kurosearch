<script lang="ts">
	import { resolve } from '$app/paths';
	import IconTextLink from '$lib/components/pure/icon-link/IconTextLink.svelte';
	import { SOURCE_CODE_URL } from '$lib/logic/app-config';

	const year = new Date().getFullYear();
</script>

<footer>
	<section>
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
	footer {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
		padding: var(--grid-gap);
		width: 100%;
		max-width: calc(var(--body-width) + 2 * var(--grid-gap));

		section {
			display: flex;
			align-items: flex-start;
			gap: 8px;
			color: var(--text-muted);
			justify-content: space-between;

			@media (max-width: 768px) {
				display: none;
			}
		}

		@media (max-width: 768px) {
			padding-bottom: calc(60px + 1rem); // Mobile nav height + extra spacing
		}

		p {
			font-size: var(--text-size-small);
			text-align: center;
			color: var(--text-muted);
			margin-bottom: 1em;
		}
	}

	.stacked-tags {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	span {
		font-size: var(--text-size-small);
	}
</style>
