<script lang="ts">
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		error: Error;
	}

	let { error }: Props = $props();

	let title = error.message === 'Failed to fetch' ? 'Connection Error' : 'Application Error';
	error.message === 'Failed to fetch'
		? 'codicon codicon-debug-disconnect'
		: 'codicon codicon-error';
	let message =
		error.message === 'Failed to fetch'
			? 'Failed to connect to the server. Make sure you have a stable internet connection.'
			: error.message;
</script>

<div class="error">
	<div class="icon">
		{#if (error.message === 'Failed to fetch')}
			<Icon icon="error-404" color="white" size="32px" />
		{:else }
			<Icon icon="mood-wrrr" color="white" size="32px" />
		{/if}
	</div>
	<div>
		<h3>{title}</h3>
		<span>{message}</span>
	</div>
</div>

<style lang="scss">
  .error {
    display: flex;
    align-items: center;
    max-width: 400px;
    margin: auto;
    margin-block: 4rem;
    gap: 2rem;
    padding: var(--grid-gap);
    border-radius: var(--border-radius);
    background-color: var(--background-1);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border: 2px solid var(--background-2);
    border-radius: var(--border-radius);
  }

  h3 {
    padding-block-end: var(--small-gap);
  }
</style>
