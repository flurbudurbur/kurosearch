<script lang="ts">
	import Gif from '$lib/components/kurosearch/media-gif/Gif.svelte';
	import Video from '$lib/components/kurosearch/media-video/Video.svelte';
	import Comments from '$lib/components/kurosearch/post-comment/Comments.svelte';
	import Rating from '$lib/components/kurosearch/rating/Rating.svelte';
	import RelativeTime from '$lib/components/kurosearch/relative-time/RelativeTime.svelte';
	import Score from '$lib/components/kurosearch/score/Score.svelte';
	import ExternalSource from '$lib/components/kurosearch/source-external/ExternalSource.svelte';
	import Rule34Source from '$lib/components/kurosearch/source-rule34/Rule34Source.svelte';
	import PostDetailsTagList from '$lib/components/kurosearch/tag-list/PostDetailsTagList.svelte';
	import PostImage from '$lib/components/pure/smart-image/PostImage.svelte';
	import { getVideoSources, isLoop } from '$lib/logic/media-utils';
	import alwaysLoop from '$lib/store/always-loop-store';
	import { APP_NAME } from '$lib/logic/app-config.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let post = $derived(data.post);

	// Used in <svelte:head> for JSON-LD structured data
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const structuredData = $derived({
		'@context': 'https://schema.org',
		'@type': 'ImageObject',
		contentUrl: post.file_url,
		thumbnailUrl: post.preview_url,
		width: post.width,
		height: post.height,
		creator: {
			'@type': 'Person',
			name: post.tags.find((t) => t.type === 'artist')?.name || 'Unknown'
		},
		keywords: post.tags.map((t) => t.name).join(', ')
	});
</script>

<svelte:head>
	<title>{APP_NAME} - Post # {post.id}</title>
	<meta name="description" content="View post #{post.id} with {post.tags.length} tags" />

	<!-- Canonical URL -->
	<link rel="canonical" href="https://flur34.com/post/{post.id}" />

	<!-- Open Graph tags -->
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://flur34.com/post/{post.id}" />
	<meta property="og:title" content="{APP_NAME} - Post #{post.id}" />
	<meta property="og:description" content="View post #{post.id} with {post.tags.length} tags" />
	{#if post.type === 'image'}
		<meta property="og:image" content={post.sample_url} />
		<meta property="og:image:width" content={post.width.toString()} />
		<meta property="og:image:height" content={post.height.toString()} />
	{/if}
	<meta property="og:site_name" content={APP_NAME} />

	<!-- Twitter Card tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{APP_NAME} - Post #{post.id}" />
	<meta name="twitter:description" content="View post #{post.id} with {post.tags.length} tags" />
	{#if post.type === 'image'}
		<meta name="twitter:image" content={post.sample_url} />
	{/if}

	<!-- Structured Data (JSON-LD) for rich snippets -->
	<script type="application/ld+json">
		{JSON.stringify(structuredData)}
	</script>
</svelte:head>

<div>
	<h1 class="visually-hidden">Post #{post.id}</h1>
	{#if post.type === 'image'}
		<PostImage {post} priority={true} />
	{:else if post.type === 'video'}
		{@const sources = getVideoSources(post.file_url, post.sample_url, post.preview_url)}
		{@const animatedSource = sources.animated}
		{@const staticSource = sources.static}
		<Video
			src={animatedSource}
			poster={staticSource}
			width={post.width}
			height={post.height}
			loop={$alwaysLoop || isLoop(post.tags)}
		/>
	{:else}
		<Gif {post} />
	{/if}
	<section>
		<h2 class="visually-hidden">Post Details</h2>
		<div class="flex-row">
			<Rating value={post.rating} />
			<span>•</span>
			<span>{post.type.toUpperCase()}</span>
			<span>•</span>
			<Score value={post.score} />
			<span>•</span>
			<RelativeTime value={post.change} />
		</div>

		<h3>Tags</h3>
		<PostDetailsTagList tags={post.tags} />

		<h3>Links</h3>
		<div class="flex-row">
			<ExternalSource source="https://rule34.xxx/index.php?page=post&s=view&id={post.id}" />
			<span>•</span>
			<Rule34Source url={post.file_url} />
			{#if post.source}
				<span>•</span>
				<ExternalSource source={post.source} />
			{/if}
		</div>

		<h3>Comments</h3>
		<Comments {post} />
	</section>
</div>

<style lang="scss">
	h3 {
		color: var(--text-highlight);
	}
	div {
		background-color: var(--background-1);
		border-radius: var(--border-radius);
	}
	section {
		display: flex;
		flex-direction: column;
		padding: var(--grid-gap);
		gap: var(--grid-gap);
	}

	.flex-row {
		display: flex;
		align-items: center;
		gap: var(--small-gap);
		overflow-x: auto;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
