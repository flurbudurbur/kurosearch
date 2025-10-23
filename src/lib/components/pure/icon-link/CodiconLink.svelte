<script lang="ts">
	import IconLink from './IconLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		title: string;
		href: string;
		icon: string;
		newtab?: boolean;
	}

	let { title, href, icon, newtab = false }: Props = $props();
</script>

<IconLink {title} {href} {newtab}>
	<Icon {icon} />
</IconLink>
