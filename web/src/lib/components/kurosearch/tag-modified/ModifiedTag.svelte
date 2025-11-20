<script lang="ts">
	import SimpleTag from '../tag-simple/SimpleTag.svelte';

	interface Props {
		tag: kurosearch.SearchableTag;
		onclick?: () => void;
		oncontextmenu?: () => void;
	}

	let { tag, onclick, oncontextmenu }: Props = $props();

	// Handle context menu to always prevent default (ModifiedTag's original behavior)
	const handleContextMenu = () => {
		oncontextmenu?.();
	};

	// Convert SearchableTag to Tag by adding missing properties with defaults
	// SearchableTag doesn't have count/type, so we provide defaults
	const tagWithDefaults = $derived({
		name: tag.name,
		count: 'count' in tag ? (tag as kurosearch.ModifiedTag).count : 0,
		type: 'type' in tag ? (tag as kurosearch.ModifiedTag).type : ('general' as kurosearch.TagType)
	});
</script>

<!-- Extract modifier from SearchableTag and pass separately to SimpleTag -->
<SimpleTag
	tag={tagWithDefaults}
	modifier={tag.modifier}
	{onclick}
	oncontextmenu={handleContextMenu}
/>
