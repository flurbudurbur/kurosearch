<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import IconButton from '../IconButton.svelte';
	import type { IconButtonProps } from '$lib/components/pure/button/IconButton.svelte';

	export interface ScrollUpButtonProps extends IconButtonProps {
		visibilityThreshold?: number;
	}

	let {
		variant = 'primary',
		icon = 'arrow-up',
		'aria-label': ariaLabel = 'back to top',
		class: className = '',
		visibilityThreshold = 0,
		...rest
	}: ScrollUpButtonProps = $props();

	let previousY = $state(0);
	let visible = $state(false);

	const listener = () => {
		const currentY = window.scrollY;
		visible = currentY < previousY && currentY > visibilityThreshold;
		previousY = currentY;
	};

	onMount(() => {
		if (browser) document.addEventListener('scroll', listener, { passive: true });
	});

	onDestroy(() => {
		if (browser) document.removeEventListener('scroll', listener);
	});

	// Simpler class composition - clear and linear
	let scrollClass = $derived(
		['scroll-up-button', visible ? 'visible' : '', className].filter(Boolean).join(' ')
	);
</script>

<IconButton
	{icon}
	{variant}
	aria-label={ariaLabel}
	class={scrollClass}
	onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
	{...rest}
/>

// styles in global.scss
