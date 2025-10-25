<script lang="ts">
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		id: string;
		icon: string;
		title: string;
		description: string;
	}

	let { id, icon, title, description }: Props = $props();
</script>

<a class="card" href="#{id}">
	<div class="icon-wrapper">
		<Icon {icon} size="32px" />
	</div>
	<div class="text">
		<h3>{title}</h3>
		<span>{description}</span>
	</div>
</a>

<style lang="scss">
	.card {
		padding: 1.5rem;
		border: 2px solid var(--background-1);
		border-radius: var(--border-radius);
		display: flex;
		align-items: center;
		gap: 1.5rem;
		transition: all var(--default-transition-behaviour);
		color: var(--text);
	}

	@media (hover: hover) {
		.card:hover {
			background-color: var(--background-1);
			border-color: var(--background-2);
		}

		.card:hover .icon-wrapper {
			border-color: var(--background-2);
		}
	}

	.icon-wrapper {
		width: 64px;
		height: 64px;
		flex-shrink: 0;
		display: grid;
		place-items: center;
		border: 2px solid var(--background-1);
		border-radius: var(--border-radius);
		transition: border-color var(--default-transition-behaviour);
		color: var(--accent);
	}

	h3 {
		color: var(--text-highlight);
		font-weight: bold;
		font-size: 18px;
		margin-bottom: var(--small-gap);
	}
</style>
