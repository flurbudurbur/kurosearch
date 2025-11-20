<script lang="ts">
	import { formatCount } from '$lib/logic/format-count';
	import columnWidthStore from '$lib/store/column-width-store';
	import results from '$lib/store/results-store';
	import SortFilterConfig from '../sort-filter-config/SortFilterConfig.svelte';

	interface Props {
		loading: boolean;
	}

	let { loading }: Props = $props();
</script>

<div id="result-header" style="--layout-width-percent: {$columnWidthStore};">
	<span class:loading>{formatCount($results.postCount)} posts</span>
	<SortFilterConfig />
</div>

<style lang="scss">
	#result-header {
		--layout-width-percent: 100;
		max-width: calc(var(--layout-width-percent) * 1vw - 4rem);
		width: 100%;
		height: var(--line-height);
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-sizing: border-box;
		margin-inline: auto;
	}

	@media (width <= calc(800px + 2rem)) {
		#result-header {
			padding-inline: var(--small-gap);
		}
	}

	@keyframes sweep {
		0% {
			background: var(--background-1);
		}
		50% {
			background: var(--background-2);
		}
		100% {
			background: var(--background-1);
		}
	}

	.loading {
		border-radius: var(--border-radius);
		color: transparent;
		padding-inline: 1em;
		animation: sweep ease-in-out 3s infinite;
	}
</style>
