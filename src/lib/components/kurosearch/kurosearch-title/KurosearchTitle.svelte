<script lang="ts">
	import { browser } from '$app/environment';
	import logo from '/static/logo.svg?raw';
	import { APP_NAME } from '$lib/logic/app-config';

	const now = new Date();

	const accessibleLabel = `${APP_NAME ?? 'flur34'} logo`;

	const getClass = (date: Date) => {
		if (date.getMonth() === 5) {
			return 'pride';
		}

		return 'default';
	};

	const cssClass = getClass(now);

	let scale = $state(1);
	let translateY = $state(0);
	let hideSubtitle = $state(false);
	let logoElement: HTMLDivElement;

	// Ease-out function for smooth animation
	const easeOut = (progress: number): number => {
		return progress * (2 - progress);
	};

	$effect(() => {
		if (browser) {
			let rafId: number;

			const handleScroll = () => {
				if (rafId) {
					cancelAnimationFrame(rafId);
				}

				rafId = requestAnimationFrame(() => {
					const scrollY = window.scrollY;

					// Start shrinking immediately, complete by 200px scroll
					const scrollThreshold = 200;
					let progress = Math.min(scrollY / scrollThreshold, 1);

					// Apply ease-out easing
					const easedProgress = easeOut(progress);

					// Scale from 3 (large hero logo at top) down to 1 (navbar size when scrolled)
					const maxScale = 3;
					const minScale = 1;
					scale = maxScale - easedProgress * (maxScale - minScale);

					// Adjust vertical position to move from hero position to navbar position
					// At top: logo should be lower (more visible in hero area)
					// When scrolled: logo should be at navbar height (translateY = -50% for centering)
					const heroOffset = 94; // How far down from center the hero logo sits (adjusted for perfect alignment)
					translateY = heroOffset * (1 - easedProgress);

					// Hide subtitle after scrolling past 50px
					hideSubtitle = scrollY > 50;
				});
			};

			window.addEventListener('scroll', handleScroll, { passive: true });
			// Initial call to set correct scale on mount
			handleScroll();

			return () => {
				window.removeEventListener('scroll', handleScroll);
				if (rafId) {
					cancelAnimationFrame(rafId);
				}
			};
		}
	});
</script>

<div
	class="title-card"
	bind:this={logoElement}
	style="transform: translateY(calc(-50% + {translateY}px)) scale({scale});"
>
	<div aria-label={accessibleLabel} role="img">
		{@html logo}
	</div>
	<h2 class="subtitle {cssClass}" class:hidden={hideSubtitle}>powered by KuroSearch</h2>
</div>

<style lang="scss">
	.title-card {
		user-select: none;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0;
		position: absolute;
		will-change: transform;
		transform-origin: center center;
		transition: transform 0.1s ease-out;
		top: 50%;

		div > :global(svg) {
			height: 32px;
			width: auto;
			will-change: color;
			color: var(--accent-color);
			transition: color 300ms ease-out;
		}

		.pride {
			background-size: 100% 80%;
			background: linear-gradient(
					#60d0fa 30%,
					#60d0fa 42%,
					#f5aab9 42%,
					#f5aab9 54%,
					#fff 54%,
					#fff 66%,
					#f5aab9 66%,
					#f5aab9 78%,
					#60d0fa 78%,
					#60d0fa 90%
				)
				bottom;
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.subtitle {
			font-size: 0.4rem;
			font-weight: 600;
			display: flex;
			place-content: flex-end;
			font-family: 'Bricolage Grotesque', sans-serif;
			font-style: italic;
			margin: 0;
			white-space: nowrap;
			transition:
				opacity 0.3s ease-out,
				transform 0.3s ease-out;
			opacity: 1;
		}

		.subtitle.hidden {
			opacity: 0;
			transform: translateY(-10px);
		}
	}
</style>
