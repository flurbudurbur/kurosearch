import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trapFocus } from '$lib/actions/trap-focus';

describe('trapFocus', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	it('should focus the first focusable element on initialization', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		container.appendChild(button1);
		container.appendChild(button2);

		const focusSpy = vi.spyOn(button1, 'focus');
		trapFocus(container);

		expect(focusSpy).toHaveBeenCalled();
	});

	it('should trap focus when Tab is pressed on last element', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		container.appendChild(button1);
		container.appendChild(button2);

		trapFocus(container);
		button2.focus();

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
		const focusSpy = vi.spyOn(button1, 'focus');

		container.dispatchEvent(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(focusSpy).toHaveBeenCalled();
	});

	it('should trap focus when Shift+Tab is pressed on first element', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		container.appendChild(button1);
		container.appendChild(button2);

		trapFocus(container);
		button1.focus();

		const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
		const focusSpy = vi.spyOn(button2, 'focus');

		container.dispatchEvent(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(focusSpy).toHaveBeenCalled();
	});

	it('should not prevent Tab when not on first or last element', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		const button3 = document.createElement('button');
		container.appendChild(button1);
		container.appendChild(button2);
		container.appendChild(button3);

		trapFocus(container);
		button2.focus();

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

		container.dispatchEvent(event);

		expect(preventDefaultSpy).not.toHaveBeenCalled();
	});

	it('should handle elements with various focusable selectors', () => {
		const button = document.createElement('button');
		const link = document.createElement('a');
		link.href = '#';
		const input = document.createElement('input');
		const select = document.createElement('select');
		const textarea = document.createElement('textarea');
		const divWithTabIndex = document.createElement('div');
		divWithTabIndex.tabIndex = 0;

		container.appendChild(button);
		container.appendChild(link);
		container.appendChild(input);
		container.appendChild(select);
		container.appendChild(textarea);
		container.appendChild(divWithTabIndex);

		const focusSpy = vi.spyOn(button, 'focus');
		trapFocus(container);

		expect(focusSpy).toHaveBeenCalled();
	});

	it('should filter out disabled elements', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		button2.disabled = true;
		const button3 = document.createElement('button');

		container.appendChild(button1);
		container.appendChild(button2);
		container.appendChild(button3);

		trapFocus(container);
		button3.focus(); // Focus last valid element
		expect(document.activeElement).toBe(button3);

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
		const focusSpy = vi.spyOn(button1, 'focus');

		container.dispatchEvent(event);

		// Tabbing from last element should cycle to first
		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(focusSpy).toHaveBeenCalled();
	});

	it('should filter out elements with tabIndex -1', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		button2.tabIndex = -1;
		const button3 = document.createElement('button');

		container.appendChild(button1);
		container.appendChild(button2);
		container.appendChild(button3);

		trapFocus(container);
		button3.focus(); // Focus last valid element
		expect(document.activeElement).toBe(button3);

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
		const focusSpy = vi.spyOn(button1, 'focus');

		container.dispatchEvent(event);

		// Tabbing from last element should cycle to first
		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(focusSpy).toHaveBeenCalled();
	});

	it('should handle case with no focusable elements', () => {
		const div = document.createElement('div');
		container.appendChild(div);

		expect(() => trapFocus(container)).not.toThrow();
	});

	it('should ignore non-Tab keys', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		container.appendChild(button1);
		container.appendChild(button2);

		trapFocus(container);
		button2.focus();

		const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

		container.dispatchEvent(event);

		expect(preventDefaultSpy).not.toHaveBeenCalled();
	});

	it('should remove event listener on destroy', () => {
		const button1 = document.createElement('button');
		const button2 = document.createElement('button');
		container.appendChild(button1);
		container.appendChild(button2);

		const { destroy } = trapFocus(container);
		destroy();

		button2.focus();
		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

		container.dispatchEvent(event);

		expect(preventDefaultSpy).not.toHaveBeenCalled();
	});

	it('should handle single focusable element', () => {
		const button = document.createElement('button');
		container.appendChild(button);

		trapFocus(container);

		// Ensure button is focused (activeElement)
		button.focus();
		expect(document.activeElement).toBe(button);

		// Tab from the only element should cycle back to itself
		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

		container.dispatchEvent(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
	});
});
