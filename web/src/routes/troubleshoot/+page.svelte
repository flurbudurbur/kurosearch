<script lang="ts">
	import { postsClient, commentsClient, tagsClient } from '$lib/logic/api-client';
	import apiKey from '$lib/store/api-key-store';
	import userId from '$lib/store/user-id-store';

	if ($apiKey && $userId) {
		postsClient.setAuth($apiKey, $userId);
		commentsClient.setAuth($apiKey, $userId);
	}

	const networkChecks = [
		{
			title: 'Tags',
			promise: tagsClient.getTagSuggestions('big')
		},
		{
			title: 'Posts',
			promise: postsClient.getPage(0, '')
		},
		{
			title: 'Comments',
			promise: commentsClient.getComments(0)
		}
	];
</script>

<h1>Troubleshooting</h1>

<h3>Network Checks</h3>
<ol>
	{#each networkChecks as check (check.title)}
		<li>
			{#await check.promise}
				<span>⏳</span>
			{:then _data}
				{void _data}
				<span>✅</span>
			{:catch _error}
				{void _error}
				<span>❌</span>
			{/await}
			<span>{check.title}</span>
		</li>
	{/each}
</ol>
