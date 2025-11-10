<script>
	import IconLink from '$lib/components/pure/icon-link/IconLink.svelte';
	import { DISCORD_URL } from '$lib/logic/app-config.js';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
</script>

<IconLink title="Discord Server" href={DISCORD_URL} newtab>
	<Icon icon="brand-discord" />
</IconLink>
