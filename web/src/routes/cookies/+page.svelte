<script lang="ts">
	import { getCookiesByCategory } from '$lib/logic/cookie-registry';
	import Heading1 from '$lib/components/pure/heading/Heading1.svelte';
	import Heading2 from '$lib/components/pure/heading/Heading2.svelte';
	import { APP_NAME } from '$lib/logic/app-config';

	const essential = getCookiesByCategory('essential');
	const preferences = getCookiesByCategory('preferences');
	const credentials = getCookiesByCategory('credentials');
</script>

<svelte:head>
	<title>{APP_NAME} - Cookies</title>
	<meta
		name="description"
		content="Information about cookies and local storage used by {APP_NAME}"
	/>
</svelte:head>

<article>
	<Heading1>Cookie Policy</Heading1>

	<section class="intro">
		<p>
			{APP_NAME} uses browser local storage to save your preferences and provide essential functionality.
			We do not use tracking cookies or share your data with third parties. All data is stored locally
			in your browser.
		</p>
	</section>

	<Heading2>Essential</Heading2>
	<section class="category">
		<p>Required for the website to function properly.</p>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Storage Key</th>
						<th>Purpose</th>
					</tr>
				</thead>
				<tbody>
					{#each essential as cookie}
						<tr>
							<td><code>{cookie.storageKey}</code></td>
							<td>{cookie.description}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<Heading2>Preferences</Heading2>
	<section class="category">
		<p>Used to remember your settings and customizations.</p>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Storage Key</th>
						<th>Purpose</th>
					</tr>
				</thead>
				<tbody>
					{#each preferences as cookie}
						<tr>
							<td><code>{cookie.storageKey}</code></td>
							<td>{cookie.description}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<Heading2>Optional Credentials</Heading2>
	<section class="category">
		<p>Only stored if you choose to provide them for enhanced functionality.</p>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Storage Key</th>
						<th>Purpose</th>
					</tr>
				</thead>
				<tbody>
					{#each credentials as cookie}
						<tr>
							<td><code>{cookie.storageKey}</code></td>
							<td>{cookie.description}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="note">
		<p>
			<strong>Note:</strong> You can clear all stored data at any time using your browser's settings or
			by clearing site data for this domain.
		</p>
	</section>
</article>

<style lang="scss">
	$gap: var(--grid-gap);

	article {
		padding-inline: $gap;
		max-width: 900px;
		margin-inline: auto;
	}

	.intro {
		margin-bottom: $gap;

		p {
			color: var(--text);
			line-height: 1.6;
		}
	}

	.category {
		margin-bottom: calc($gap * 2);

		> p {
			color: var(--text-2);
			margin-bottom: $gap;
		}
	}

	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background-color: var(--background-1);
		border-radius: var(--border-radius);
		overflow: hidden;
	}

	th,
	td {
		padding: calc($gap * 0.75);
		text-align: left;
	}

	th {
		background-color: var(--background-2);
		color: var(--text-highlight);
		font-weight: 600;
	}

	td {
		border-bottom: 1px solid var(--background-2);
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr:nth-child(even) {
		background-color: var(--background-0);
	}

	code {
		font-family: monospace;
		font-size: 0.85em;
		color: var(--accent);
		word-break: break-all;
	}

	.note {
		margin-top: calc($gap * 2);
		padding: $gap;
		background-color: var(--background-1);
		border-radius: var(--border-radius);
		border-left: 3px solid var(--accent);

		p {
			margin: 0;
			color: var(--text-2);
		}

		strong {
			color: var(--text-highlight);
		}
	}
</style>
