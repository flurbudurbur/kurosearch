<script lang="ts">
	import { APP_NAME } from '$lib/logic/app-config.js';
	import Heading1 from '$lib/components/pure/heading/Heading1.svelte';
	import Instance from '$lib/components/pure/instance/Instance.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const instances = data.instances;
</script>

<svelte:head>
	<title>{APP_NAME} - Instances</title>
	<meta name="description" content="Hosting instructions for {APP_NAME}" />
</svelte:head>

<section>
	<Heading1>Public instances</Heading1>
	<div class="info-text">
		<p>Click on a host for more information!</p>
		<p>
			Note: This list is currently static. Future developments will allow others to request being
			added.
		</p>
		<p style="text-decoration: underline;">
			This is all dummy-data. Actual data fetching is not implemented yet.
		</p>
	</div>
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Country</th>
				<th>Description</th>
				<th>Uptime</th>
				<th>Source</th>
			</tr>
		</thead>
		{#each instances as instance}
			<Instance {...instance} />
		{/each}
	</table>
</section>

<style lang="scss">
	section {
		padding-inline: var(--grid-gap);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		border-radius: var(--border-radius);
	}

	th {
		text-align: left;
		text-transform: capitalize;
	}

	.info-text {
		font-size: var(--text-size-large);
		margin-bottom: 1rem;
		background: var(--background-1);
		width: 100%;
		padding: 1rem;
		border-radius: var(--border-radius);
	}
</style>
