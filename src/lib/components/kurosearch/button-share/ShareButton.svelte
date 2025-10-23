<script lang="ts">
	import { getShareUrl } from '$lib/logic/url-parsing';
	import activeTags from '$lib/store/active-tags-store';
	import sort from '$lib/store/sort-store';
	import filter from '$lib/store/filter-store';
	import TagButton from '../button-tag/TagButton.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	const share = async () => {
		const shareData = {
			title: 'kurosearch',
			text: 'Saved Search Configuration',
			url: getShareUrl($activeTags, $sort, $filter).toString()
		};

		try {
			await navigator.share(shareData);
		} catch {
			// ignored
		}
	};
</script>

<TagButton title="Share current search." onclick={share} aria-label="Share current search">
	<Icon icon="share" color="white" />
</TagButton>

<style lang="scss">
	img {
		width: 16px;
		height: 16px;
		padding-block: 1px;
	}
</style>
