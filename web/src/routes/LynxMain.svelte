<script lang="ts">
	import lynxChibiSrc from '$lib/assets/lynxy-chibi.webp';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	let details = $state(false);
</script>

<div>
	<button type="button" onclick={() => (details = !details)}>
		<img id="happy" src={lynxChibiSrc} alt="Helheim Lynx" />
	</button>
	{#if details}
		<a href="https://www.twitch.tv/helheim_lynx" target="_blank" title="Check out Lynxy!">
			<Icon icon="external-link" />
			Check out Lynx on Twitch!
		</a>
	{/if}
</div>

<style lang="scss">
	div {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		contain: strict;
		padding-inline: var(--small-gap);
		position: relative;
	}

	button {
		display: flex;
		justify-content: center;
		align-items: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;

		&:hover img {
			transform: scale(1.05);
		}

		&:active img {
			transform: scale(0.98);
		}
	}

	a {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: var(--small-gap);
		padding: var(--grid-gap);
		color: var(--accent);
		background: var(--background-0);
		border: solid 2px currentColor;
		border-radius: var(--border-radius);
		text-decoration: none;

		&:hover {
			background: var(--background-1);
		}
	}

	img {
		display: block;
		height: min(100%, 150px);
		width: min(100%, 214px);
		aspect-ratio: 1231 / 864;
		object-fit: contain;
		transition: transform 0.2s ease;
	}
</style>
