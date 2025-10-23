<script module lang="ts">
	export const ICON_BUTTON_VARIANTS = [
		'transparent',
		'with-background',
		'half-background'
	] as const;
	export type IconButtonVariant = (typeof ICON_BUTTON_VARIANTS)[number];
</script>

<script lang="ts">
	import Button from './Button.svelte';
	import type { ButtonProps } from './Button.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'class'> {
		icon?: string;
		variant?: IconButtonVariant | ButtonProps['variant'];
		class?: string;
	}

	let {
		icon,
		variant = 'transparent',
		class: className = '',
		onclick,
		...rest
	}: IconButtonProps = $props();

	// Resolve variant once - if it's an IconButton-specific variant, use 'custom' for Button
	let buttonVariant = $derived(
		variant && ICON_BUTTON_VARIANTS.includes(variant as IconButtonVariant)
			? 'custom'
			: variant as ButtonProps['variant']
	);

	// Build complete class string - clear, linear composition
	let buttonClass = $derived([
		'icon-button',
		variant ? `icon-button--${variant}` : '',
		className
	].filter(Boolean).join(' '));

	// Define all CSS custom properties in one place for clarity
	const iconButtonStyles = {
		'--button-width': 'var(--line-height)',
		'--button-height': 'var(--line-height)',
		'--button-min-height': 'var(--line-height)',
		'--button-border-radius': 'var(--border-radius-full)',
		'--button-padding-inline': '0',
		'--button-aspect-ratio': '1',
		'--button-font-size': 'var(--text-size-large)'
	};

	let styleString = $derived(
		Object.entries(iconButtonStyles).map(([k, v]) => `${k}: ${v}`).join('; ')
	);
</script>

<Button
	variant={buttonVariant}
	size="small"
	class={buttonClass}
	style={styleString}
	onclick={(e) => {
		e.stopPropagation();
		onclick?.(e);
	}}
	{...rest}
>
	{#if icon}
		<Icon {icon} />
	{/if}
	{@render rest.children?.()}
</Button>

<style lang="scss">
	// IconButton-specific variant styles
	:global(.icon-button--transparent) {
		background-color: transparent !important;

		@media (hover: hover) {
			&:hover {
				background-color: var(--background-1) !important;
			}
		}

		&:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}

		&:active {
			background-color: var(--background-1) !important;
			filter: brightness(0.9);
			transform: translateY(1px);
		}
	}

	:global(.icon-button--with-background) {
		background-color: var(--background-1) !important;

		@media (hover: hover) {
			&:hover {
				background-color: var(--background-2) !important;
			}
		}

		&:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}

		&:active {
			background-color: var(--background-2) !important;
			filter: brightness(0.9);
			transform: translateY(1px);
		}
	}

	:global(.icon-button--half-background) {
		background-color: rgba(var(--background-1-rgb, 128, 128, 128), 0.5) !important;

		@media (hover: hover) {
			&:hover {
				background-color: var(--background-1) !important;
			}
		}

		&:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}

		&:active {
			background-color: var(--background-1) !important;
			filter: brightness(0.9);
			transform: translateY(1px);
		}
	}
</style>
