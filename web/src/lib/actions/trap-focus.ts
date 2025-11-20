/**
 * Focus trap action for modal/dialog components
 * Traps keyboard focus within an element for better accessibility
 */
export function trapFocus(node: HTMLElement) {
	const focusableElements =
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

	function getFocusableElements(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(focusableElements)).filter(
			(el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
		);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		const focusable = getFocusableElements();
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (event.shiftKey) {
			// Shift + Tab
			if (document.activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		} else {
			// Tab
			if (document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}

	// Focus the first focusable element when the trap is activated
	const focusable = getFocusableElements();
	if (focusable.length > 0) {
		focusable[0].focus();
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
