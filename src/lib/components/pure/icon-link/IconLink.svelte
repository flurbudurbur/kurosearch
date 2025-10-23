<script lang="ts">
	interface Props {
		title: string;
		href: string;
		newtab?: boolean;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { title, href, newtab = false, class: className = '', children }: Props = $props();
</script>

<a
	{title}
	{href}
	target={newtab ? '_blank' : '_self'}
	rel={newtab ? 'noopener noreferrer' : undefined}
	aria-label={title}
	class={className}
>
	{@render children?.()}
</a>

<style lang="scss">
	a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: var(--line-height);
		height: var(--line-height);
		border-radius: var(--border-radius-full);
		color: var(--text);
		background-color: transparent;
		font-size: var(--text-size-large);
		text-align: center;

		&:hover {
			background-color: var(--background-1);
			color: var(--text-highlight);
		}

		&:active {
			background-color: var(--background-2);
			scale: 0.95;
		}
	}

	@media (hover: hover) {
		a {
			transition: background-color var(--default-transition-behaviour);

			&:hover {
				background-color: var(--background-1);
				color: var(--text-highlight);
			}

			&:active {
				background-color: var(--background-2);
				scale: 0.95;
			}
		}
	}
</style>
