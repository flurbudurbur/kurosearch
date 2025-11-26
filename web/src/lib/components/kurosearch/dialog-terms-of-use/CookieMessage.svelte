<script lang="ts">
	import TextButton from '$lib/components/pure/button/TextButton.svelte';
	import cookiesAccepted from '$lib/store/cookies-accepted-store';
	import LynxMain from '../../../../routes/LynxMain.svelte';
	import logo from '$lib/assets/logo.svg?raw';
	import Heading2 from '$lib/components/pure/heading/Heading2.svelte';
	import Heading3 from '$lib/components/pure/heading/Heading3.svelte';

	const accept = () => {
		$cookiesAccepted = true;
		document.documentElement.dataset.cookies = 'true';
		localStorage.setItem('kurosearch:cookies-accepted', 'true');
	};

	const leave = () => {
		history.back();
	};
</script>

<div id="cookie-dialog" class="backdrop">
	<section>
		<LynxMain />
		<div aria-label="flur34 logo" role="img">
			{@html logo}
		</div>
		<Heading2>Terms of Use</Heading2>
		<Heading3>Mature Content Disclosure</Heading3>
		<p>
			This website contains mature content. By using this website you confirm that you are legally
			allowed to view such content.
		</p>
		<Heading3>Use of Cookies</Heading3>
		<p>
			Additionally, this website uses cookies for essential functionality only.
			<a href="/cookies">View our cookie policy</a> for full transparency.
		</p>
		<div class="row">
			<TextButton title="Accept terms of use" onclick={accept}>Accept</TextButton>
			<TextButton title="Leave website" type="secondary" onclick={leave}>Leave</TextButton>
		</div>
	</section>
</div>

<style lang="scss">
	section {
		display: flex;
		flex-direction: column;
		background-color: var(--background-0);
		gap: var(--grid-gap);
		padding: var(--grid-gap);
		max-width: 500px;
		border-radius: var(--border-radius-large);
		text-align: center;
		place-content: center;

		// Child layout
		.row {
			align-self: center;
			display: flex;
			gap: var(--grid-gap);
		}
	}

	div > :global(svg) {
		width: auto;
		margin: 0 3rem;
		will-change: color;
		color: var(--accent-color);
		transition: color 300ms ease-out;
	}

	a {
		color: var(--accent);
		text-decoration: underline;

		&:hover {
			color: var(--text-highlight);
		}
	}

	.backdrop {
		z-index: var(--z-dialog);
		position: fixed;
		display: none;
		justify-content: center;
		align-items: center;
		width: 100vw;
		height: 100vh;
		backdrop-filter: blur(10px);
		overflow: hidden;
	}

	@media not (min-width: 600px) {
		.backdrop {
			background-color: var(--background-0);
		}
	}

	@media (min-width: 600px) {
		section {
			border: solid 2px crimson;
			box-shadow: 0 0 100px 100px black;
		}
	}
</style>
