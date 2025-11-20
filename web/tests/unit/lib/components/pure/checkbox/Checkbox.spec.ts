import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import Checkbox from '$lib/components/pure/checkbox/Checkbox.svelte';

describe('Checkbox', () => {
	it('renders props correctly', () => {
		render(Checkbox, { checked: true, id: 'test-checkbox' });

		const checkbox: HTMLInputElement = screen.getByRole('checkbox');
		expect(checkbox).toBeDefined();
		expect(checkbox.checked).toBe(true);
	});

	it('is clickable', async () => {
		render(Checkbox, { checked: true, id: 'test-checkbox' });

		const checkbox: HTMLInputElement = screen.getByRole('checkbox');
		await fireEvent.click(checkbox);
		expect(checkbox.checked).toBe(false);
	});
});
