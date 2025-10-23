<script lang="ts">
	import { iconRegistry } from './icons';

	interface Props {
		/**
		 * Icon name from Tabler icons
		 * @see https://tabler.io/icons
		 */
		icon: string;

		/**
		 * Icon size (width and height in pixels or as string with units)
		 */
		size?: string | number;

		/**
		 * Icon color (any valid CSS color)
		 */
		color?: string;

		/**
		 * Additional CSS classes
		 */
		class?: string;

		/**
		 * Whether the icon should be inline
		 */
		inline?: boolean;
	}

	let {
		icon,
		size = '1.5em',
		color = undefined,
		class: className = '',
		inline = true
	}: Props = $props();

	// Get the icon component from the registry
	const IconComponent = $derived(() => {
		const normalizedIcon = icon.toLowerCase();
		const component = iconRegistry[normalizedIcon];

		if (!component) {
			console.error(
				`Icon not found: ${normalizedIcon}. Available icons:`,
				Object.keys(iconRegistry).sort()
			);
			return null;
		}

		return component;
	});
</script>

{#if IconComponent()}
	{@const Component = IconComponent()}
	<Component
		width={size}
		height={size}
		{color}
		class={className}
		style={inline ? 'display: inline-block; vertical-align: middle;' : ''}
	/>
{/if}
