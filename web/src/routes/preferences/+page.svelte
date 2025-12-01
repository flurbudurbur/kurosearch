<script lang="ts" module>
	const THEME_OPTIONS = Object.freeze({
		'crimson system': 'Follow System',
		'crimson dark': 'Dark',
		'crimson light': 'Light',
		'hotpink system': 'Follow System Bubblegum',
		'hotpink light': 'Light Bubblegum',
		'hotpink dark': 'Dark Bubblegum',
		'crimson coffee': 'Coffee'
	});
</script>

<script lang="ts">
	import type { Component } from 'svelte';
	import Checkbox from '$lib/components/pure/checkbox/Checkbox.svelte';
	import Heading1 from '$lib/components/pure/heading/Heading1.svelte';
	import Preference from '$lib/components/pure/preference/Preference.svelte';
	import Select from '$lib/components/pure/select/Select.svelte';
	import TextButton from '$lib/components/pure/button/TextButton.svelte';
	import { ALL_BLOCKING_GROUPS, BLOCKING_GROUP_TAGS } from '$lib/logic/blocking-group-data';

	function getBlockedTags(groupName: kurosearch.BlockingGroup) {
		return BLOCKING_GROUP_TAGS[groupName];
	}

	import blockedContent from '$lib/store/blocked-content-store';
	import localstorageEnabled from '$lib/store/localstorage-enabled-store';
	import alwaysLoop from '$lib/store/always-loop-store';
	import theme from '$lib/store/theme-store';
	import apiKey from '$lib/store/api-key-store';
	import userId from '$lib/store/user-id-store';
	import resultColumns from '$lib/store/result-columns-store';
	import cookiesAccepted from '$lib/store/cookies-accepted-store';
	import highResolutionEnabled from '$lib/store/high-resolution-enabled';
	import resultsStore from '$lib/store/results-store';
	import activeTagsStore from '$lib/store/active-tags-store';
	import autoplayFullscreenEnabled from '$lib/store/autoplay-fullscreen-enabled-store';
	import autoplayFullscreenDelay from '$lib/store/autoplay-fullscreen-delay-store';
	import activeSupertagsStore from '$lib/store/active-supertags-store';
	import wideLayoutEnabled from '$lib/store/wide-layout-enabled-store';
	import gifPreloadEnabled from '$lib/store/gif-preload-enabled-store';
	import columnWidthStore from '$lib/store/column-width-store';
	import { addHistory } from '$lib/logic/use/onpopstate';
	import NumberInput from '$lib/components/kurosearch/dialog-sort-filter/NumberInput.svelte';
	import TextInput from '$lib/components/pure/input-text/TextInput.svelte';
	import pageNavigationEnabled from '$lib/store/page-navigation-enabled-store';
	import { APP_NAME } from '$lib/logic/app-config';
	import IconLink from '$lib/components/pure/icon-link/IconLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { tick } from 'svelte';

	let resetDialog: HTMLDialogElement = $state<HTMLDialogElement>() as HTMLDialogElement;
	let layoutConfigDialog: HTMLDialogElement = $state<HTMLDialogElement>() as HTMLDialogElement;
	let ConfirmDialog:
		| Component<{
				dialog: HTMLDialogElement;
				title: string;
				warning: string;
				labelCancel: string;
				labelConfirm: string;
				onconfirm: () => void;
		  }>
		| undefined = $state(undefined);
	let LayoutConfigDialog:
		| Component<{
				dialog: HTMLDialogElement;
				onclose?: () => void;
		  }>
		| undefined = $state(undefined);

	const reset = () => {
		theme.reset();
		localstorageEnabled.reset();
		blockedContent.reset();
		alwaysLoop.reset();
		resultColumns.reset();
		cookiesAccepted.reset();
		highResolutionEnabled.reset();
		wideLayoutEnabled.reset();
		gifPreloadEnabled.reset();
		columnWidthStore.reset();
		apiKey.reset();
		userId.reset();
		pageNavigationEnabled.reset();
	};
</script>

<svelte:head>
	<title>{APP_NAME} - Preferences</title>
	<meta
		name="description"
		content="Customize your {APP_NAME} browsing experience however you like."
	/>
</svelte:head>

<section>
	<Heading1>Preferences</Heading1>

	<Preference title="Theme" icon="paint" description="Change the look of the app.">
		<Select bind:value={$theme} options={THEME_OPTIONS} aria-label="Theme" />
	</Preference>

	<Preference title="API Access" icon="key" description="Use your own API key to rule34.xxx.">
		<div class="button-row">
			<TextInput bind:value={$apiKey} placeholder="Enter your API key here" aria-label="API Key" />
			<TextInput bind:value={$userId} placeholder="Enter your User Id here" aria-label="User ID" />
			<IconLink
				href="https://rule34.xxx/index.php?page=account&s=options"
				title="Manage your API key on rule34.xxx"
				aria-label="Manage your API key on rule34.xxx"
				newtab
			>
				Manage your API key
				<Icon icon="external-link" />
			</IconLink>
		</div>
	</Preference>

	<Preference
		title="Save Tags & Posts"
		icon="history-toggle"
		description="Save active tags and posts between sessions."
	>
		<Checkbox id="checkbox-localstorage-enabled" bind:checked={$localstorageEnabled}>
			{$localstorageEnabled ? 'Save' : "Don't save"}
		</Checkbox>
		<div class="button-row">
			<TextButton title="Reset Posts" type="secondary" onclick={() => resultsStore.reset()}>
				Reset Posts
			</TextButton>
			<TextButton
				title="Reset Tags"
				type="secondary"
				onclick={() => {
					activeTagsStore.reset();
					activeSupertagsStore.reset();
				}}
			>
				Reset Tags
			</TextButton>
		</div>
	</Preference>

	<Preference
		title="Blocked Content"
		icon="eye-off"
		description="Completely prevent certain types of posts without cluttering your search."
	>
		<div class="blocked-content-list">
			{#each ALL_BLOCKING_GROUPS as groupName}
				<div class="blocked-content-item">
					<Checkbox id={`checkbox-${String(groupName)}`} bind:checked={$blockedContent[groupName]}>
						<p>{groupName}</p>
					</Checkbox>
					<p class="blocked-tags" aria-label={`Blocked tags for ${String(groupName)}`}>
						{getBlockedTags(groupName).join(', ')}
					</p>
				</div>
			{/each}
		</div>
	</Preference>

	<Preference
		title="Loop Videos"
		icon="repeat"
		description="By default only videos with the 'loop' tag are looped. When this setting is enabled, all videos are looped."
	>
		<Checkbox id="checkbox-always-loop" bind:checked={$alwaysLoop}>
			{$alwaysLoop ? 'Always' : "Only with 'loop' tag"}
		</Checkbox>
	</Preference>

	<Preference
		title="Autoscroll in Fullscreen"
		icon="arrow-autofit-right"
		description="When enabled, fullscreen view will scroll automatically."
	>
		<div class="flex">
			<Checkbox id="checkbox-fullscreen-autplay" bind:checked={$autoplayFullscreenEnabled}>
				{$autoplayFullscreenEnabled ? 'Enabled' : 'Disabled'}
			</Checkbox>
			<NumberInput
				bind:value={$autoplayFullscreenDelay}
				min={1}
				max={60}
				step={1}
				aria-label="Autoscroll delay in seconds"
			/>
			<span>{$autoplayFullscreenDelay} seconds</span>
		</div>
	</Preference>

	<Preference
		title="Result layout"
		icon="layout"
		description="Configure how posts are displayed: number of columns and layout width."
	>
		<div class="layout-info">
			<p>
				Current: <strong
					>{$resultColumns} column{$resultColumns !== '1' ? 's' : ''}, {$columnWidthStore}% width</strong
				>
			</p>
			<TextButton
				title="Configure layout"
				type="primary"
				onclick={async () => {
					// Lazy-load LayoutConfigDialog only when user wants to configure
					if (!LayoutConfigDialog) {
						const module = await import(
							'$lib/components/kurosearch/dialog-layout-config/LayoutConfigDialog.svelte'
						);
						LayoutConfigDialog = module.default;
						await tick(); // Wait for component to mount and dialog ref to be set
					}
					layoutConfigDialog?.showModal();
					addHistory('dialog');
				}}
			>
				Configure Layout
			</TextButton>
		</div>
	</Preference>

	<Preference
		title="Enable Page Navigation"
		icon="switch-vertical"
		description="Navigate using pages instead of infinite scrolling."
	>
		<div class="flex">
			<Checkbox id="checkbox-page-navigation" bind:checked={$pageNavigationEnabled}>
				{$pageNavigationEnabled ? 'Enabled' : 'Disabled'}
			</Checkbox>
		</div>
	</Preference>

	<Preference
		title="Higher Resolution"
		icon="badge-hd"
		description="When enabled, the app will always load the highest resolution available. This causes increased network consumption and can impact performance."
	>
		<Checkbox id="checkbox-high-resolution-enabled" bind:checked={$highResolutionEnabled}>
			{$highResolutionEnabled ? 'Enabled' : 'Disabled'}
		</Checkbox>
	</Preference>

	<Preference
		title="Gif Preload"
		icon="progress-down"
		description="When enabled, GIFs will load faster if you have a powerful internet connection but consume more bandwidth. Do not enable with limited bandwidth."
	>
		<Checkbox id="checkbox-gif-preload-enabled" bind:checked={$gifPreloadEnabled}>
			{$gifPreloadEnabled ? 'Enabled' : 'Disabled'}
		</Checkbox>
	</Preference>

	<Preference
		title="Reset preferences"
		icon="trash"
		description="Undo all customizations and return to default settings."
	>
		<TextButton
			title="Reset preferences"
			type="secondary"
			onclick={async () => {
				// Lazy-load ConfirmDialog only when user wants to reset
				if (!ConfirmDialog) {
					const module = await import(
						'$lib/components/kurosearch/dialog-confirm/ConfirmDialog.svelte'
					);
					ConfirmDialog = module.default;
				}
				resetDialog?.showModal();
				addHistory('dialog');
			}}
		>
			Reset
		</TextButton>
	</Preference>
</section>

{#if ConfirmDialog}
	<ConfirmDialog
		bind:dialog={resetDialog}
		title="Reset Preferences"
		warning="This will reset all your settings to default values. Are you sure you want to do that?"
		labelConfirm="Yes, reset"
		labelCancel="Cancel"
		onconfirm={reset}
	/>
{/if}

{#if LayoutConfigDialog}
	<LayoutConfigDialog bind:dialog={layoutConfigDialog} />
{/if}

<style lang="scss">
	section {
		padding-inline: var(--grid-gap);
	}

	.button-row {
		display: flex;
		flex-direction: row;
		padding-block-start: var(--grid-gap);
		flex-wrap: wrap;
		gap: var(--grid-gap);
		align-items: center;

		:global(input[type='text']) {
			flex-grow: 1;
			min-width: 200px;
		}

		:global(a) {
			gap: 0.25em;
			font-size: 1rem;
			color: deepskyblue;
		}
	}

	.flex {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--grid-gap);
	}

	.layout-info {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
		align-items: flex-start;

		p {
			margin: 0;
			font-size: 0.9rem;
			color: var(--text-secondary);

			strong {
				color: var(--text-primary);
			}
		}
	}

	.blocked-content-list {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
	}

	.blocked-content-item {
		display: flex;
		flex-direction: column;
	}

	.blocked-tags {
		line-height: 1.1rem;
		margin-inline-start: calc(24px + var(--grid-gap));
		font-size: 0.875rem;
		color: var(--text-secondary);
		opacity: 0.7;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.blocked-tags {
			margin-top: -1rem;
		}
	}
</style>
