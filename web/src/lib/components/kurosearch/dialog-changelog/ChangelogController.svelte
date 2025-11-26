<script lang="ts">
	import { browser } from '$app/environment';
	import { version } from '$app/environment';
	import { onMount } from 'svelte';
	import ChangelogDialog from './ChangelogDialog.svelte';
	import lastSeenVersionStore from '$lib/store/last-seen-version-store';
	import cookiesAccepted from '$lib/store/cookies-accepted-store';
	import { fetchChangelog, shouldShowChangelog, type Changelog } from '$lib/logic/changelog-utils';

	let dialog: HTMLDialogElement;
	let changelog: Changelog | null = $state(null);
	let shouldAutoShow = $state(false);
	let hasShown = $state(false);

	/**
	 * Open the changelog dialog manually
	 * Can be called from parent component or via context
	 */
	export const open = async () => {
		if (!changelog) {
			changelog = await fetchChangelog();
		}
		dialog?.showModal();
	};

	// Check if we should auto-show on mount
	onMount(async () => {
		if (!browser) return;

		const storedVersion = localStorage.getItem('kurosearch:last-seen-version') ?? '';

		if (shouldShowChangelog(storedVersion, version)) {
			shouldAutoShow = true;
			// Pre-fetch changelog
			changelog = await fetchChangelog();
		}
	});

	// Wait for cookies to be accepted before showing
	$effect(() => {
		if (browser && $cookiesAccepted && shouldAutoShow && !hasShown && dialog) {
			// Small delay to ensure DOM is ready and age-gate is dismissed
			setTimeout(() => {
				dialog?.showModal();
				hasShown = true;
			}, 300);
		}
	});

	const handleAcknowledge = () => {
		lastSeenVersionStore.set(version);
	};
</script>

<ChangelogDialog
	bind:dialog
	{changelog}
	currentVersion={version}
	onacknowledge={handleAcknowledge}
/>
