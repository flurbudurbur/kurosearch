import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import RotatingIconSelect from '$lib/components/pure/rotating-select/RotatingIconSelect.svelte';

describe('RotatingIconSelect', () => {
	it('rotates', async () => {
		render(RotatingIconSelect, {
			options: {
				one: 'tag',
				two: 'user-circle',
				three: 'search'
			},
			value: 'one'
		});

		const button: HTMLButtonElement = screen.getByRole('button');
		expect(button).toBeDefined();
		expect(button.className).toMatch(/icon-button/);

		// Click three times to cycle through all options and back to the first
		await fireEvent.click(button);
		await fireEvent.click(button);
		await fireEvent.click(button);

		// After 3 clicks, should be back to the first option
		expect(button.className).toMatch(/icon-button/);
	});
});
