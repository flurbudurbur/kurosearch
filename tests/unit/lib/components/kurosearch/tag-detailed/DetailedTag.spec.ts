import { describe, expect, it, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/svelte';
import DetailedTag from '$lib/components/kurosearch/tag-detailed/DetailedTag.svelte';

describe('DetailedTag', () => {
	// Cleanup after each test to prevent async cleanup warnings
	// The longpress action may load TinyGesture asynchronously
	afterEach(async () => {
		cleanup();
		// Wait for any pending async operations (e.g., TinyGesture loading)
		await new Promise((resolve) => setTimeout(resolve, 50));
	});
	it('renders correctly without icon', () => {
		render(DetailedTag, { tag: { name: 'my_tag', count: 10, modifier: '+', type: 'ambiguous' } });

		const tag: HTMLButtonElement = screen.getByRole('button');
		expect(tag).toBeDefined();
		expect(tag.textContent?.trim()).toBe('my tag (10)');
		expect(tag.className).toMatch(/no-icon/);
	});

	it('renders correctly with icon', () => {
		render(DetailedTag, { tag: { name: 'my_tag', count: 10, modifier: '+', type: 'supertag' } });

		const tag: HTMLButtonElement = screen.getByRole('button');
		expect(tag).toBeDefined();
		expect(tag.textContent?.trim()).toBe('my tag (10)');
		expect(tag.className).toMatch(/star-filled/);
	});

	it('renders correctly when active', () => {
		render(DetailedTag, {
			tag: { name: 'my_tag', count: 10, modifier: '+', type: 'ambiguous' },
			active: true
		});

		const tag: HTMLButtonElement = screen.getByRole('button');
		expect(tag).toBeDefined();
		expect(tag.textContent?.trim()).toBe('my tag (10)');
		expect(tag.className).toMatch(/active/);
	});

	it('is clickable', async () => {
		const click = vi.fn();
		const contextMenu = vi.fn();
		render(DetailedTag, {
			tag: { name: 'my_tag', count: 10, modifier: '+', type: 'ambiguous' }
		});

		const tag: HTMLButtonElement = screen.getByRole('button');
		tag.addEventListener('click', click);
		tag.addEventListener('contextmenu', contextMenu);
		await fireEvent.click(tag);
		expect(click).toHaveBeenCalled();
		await fireEvent.contextMenu(tag);
		expect(contextMenu).toHaveBeenCalled();
	});
});
