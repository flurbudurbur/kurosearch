<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	export interface CheckboxProps extends Omit<HTMLInputAttributes, 'size'> {
		checked: boolean;
		id: string;
		size?: 'small' | 'medium' | 'large';
		children?: Snippet;
	}

	let {
		checked = $bindable(),
		id,
		size = 'medium',
		class: className = '',
		children,
		...restProps
	}: CheckboxProps = $props();

	let computedLabelClasses = $derived(`checkbox-label checkbox-label--${size} ${className}`.trim());
	let computedInputClasses = $derived(`checkbox-input checkbox-input--${size}`.trim());
</script>

<label for={id} class={computedLabelClasses}>
	<input type="checkbox" {id} bind:checked class={computedInputClasses} {...restProps} />
	{#if children}
		{@render children()}
	{/if}
</label>

<style lang="scss">
	@use 'sass:map';

	$checkbox-sizes: (
		small: (
			size: 18px,
			font-size: 0.875rem,
			gap: 0.5rem
		),
		medium: (
			size: 24px,
			font-size: inherit,
			gap: var(--grid-gap, 0.75rem)
		),
		large: (
			size: 30px,
			font-size: 1.125rem,
			gap: 1rem
		)
	);

	// Mixins for better reusability
	@mixin checkbox-size($size-config) {
		min-width: map.get($size-config, size);
		min-height: map.get($size-config, size);
		width: map.get($size-config, size);
		height: map.get($size-config, size);
	}

	@mixin label-size($size-config) {
		gap: map.get($size-config, gap);
		font-size: map.get($size-config, font-size);
	}

	@mixin checkbox-disabled-state {
		opacity: 0.5;
		cursor: not-allowed !important;

		&:hover {
			opacity: 0.5;
		}
	}

	// Base label styles
	.checkbox-label {
		/* CSS custom properties with fallbacks */
		--checkbox-gap: var(--grid-gap, 0.75rem);
		--checkbox-transition: all var(--default-transition-behaviour, 0.2s ease);

		// Base styling
		display: flex;
		align-items: center;
		@include label-size(map.get($checkbox-sizes, medium));
		cursor: pointer;
		user-select: none;
		position: relative;

		// Smooth transitions
		transition: var(--checkbox-transition);

		// Focus handling for accessibility
		&:focus-within {
			outline: none;
		}

		// Disabled state
		&:has(input:disabled) {
			@include checkbox-disabled-state;
		}
	}

	// Base input styles
	.checkbox-input {
		/* CSS custom properties */
		--checkbox-border-radius: var(--border-radius, 4px);
		--checkbox-border-color: var(--text, currentColor);
		--checkbox-border-width: 2px;
		--checkbox-checked-bg: var(--accent, #007bff);
		--checkbox-checked-color: var(--text-accent, #ffffff);
		--checkbox-focus-color: var(--accent, #007bff);

		// Reset and base styling
		margin: 0;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		@include checkbox-size(map.get($checkbox-sizes, medium));
		border: var(--checkbox-border-width) solid var(--checkbox-border-color);
		border-radius: var(--checkbox-border-radius);
		background-color: transparent;
		cursor: pointer;
		flex-shrink: 0;
		position: relative;
		transition: var(--checkbox-transition);

		// Hover state
		@media (hover: hover) {
			&:hover:not(:disabled) {
				border-color: var(--checkbox-checked-bg);
				background-color: rgba(0, 123, 255, 0.1);
			}
		}

		// Focus state
		&:focus {
			outline: none;
		}

		&:focus-visible {
			outline: 2px solid var(--checkbox-focus-color);
			outline-offset: 2px;
		}

		// Checked state
		&:checked {
			background-color: var(--checkbox-checked-bg);
			border-color: var(--checkbox-checked-bg);

			// Checkmark
			&::after {
				content: '';
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%) rotate(45deg);
				width: 35%;
				height: 65%;
				border: solid var(--checkbox-checked-color);
				border-width: 0 2px 2px 0;
			}
		}

		// Active state
		&:active:not(:disabled) {
			transform: scale(0.95);
		}

		// Disabled state
		&:disabled {
			opacity: 0.5;
			cursor: not-allowed !important;
		}
	}

	// Size variants using the map and mixin
	@each $size, $config in $checkbox-sizes {
		@if $size != medium {
			.checkbox-label--#{$size} {
				@include label-size($config);
			}

			.checkbox-input--#{$size} {
				@include checkbox-size($config);
			}
		}
	}

	// Responsive adjustments
	@media (max-width: 1024px) {
		.checkbox-label {
			min-height: 48px;
		}

		// Ensure touch targets are at least 48px on mobile
		.checkbox-input {
			// Add transparent padding around the checkbox for larger touch area
			&::before {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				min-width: 48px;
				min-height: 48px;
			}
		}
	}

	// High contrast mode support
	@media (prefers-contrast: more) {
		.checkbox-input:not(:disabled) {
			border-width: 3px;
		}
	}

	// Reduced motion support
	@media (prefers-reduced-motion: reduce) {
		.checkbox-label,
		.checkbox-input {
			transition: none;
		}
	}
</style>
