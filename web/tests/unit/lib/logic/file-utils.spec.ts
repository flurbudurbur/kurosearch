import { describe, it, expect, vi } from 'vitest';
import { saveFile, loadFile } from '$lib/logic/file-utils';

const resetDom = () => {
	document.body.innerHTML = '';
	vi.restoreAllMocks();
};

describe('file-utils', () => {
	it('saveFile uses showSaveFilePicker when available', async () => {
		resetDom();
		const write = vi.fn();
		const close = vi.fn();
		const createWritable = vi.fn(async () => ({ write, close }));
		// @ts-ignore mock window
		(globalThis as any).showSaveFilePicker = vi.fn(async () => ({ createWritable }));

		await saveFile('hello');

		expect((globalThis as any).showSaveFilePicker).toHaveBeenCalledOnce();
		expect(createWritable).toHaveBeenCalledOnce();
		expect(write).toHaveBeenCalledWith('hello');
		expect(close).toHaveBeenCalledOnce();

		// cleanup
		// @ts-ignore
		delete (globalThis as any).showSaveFilePicker;
	});

	it('saveFile falls back to anchor download when picker not available', async () => {
		resetDom();
		// @ts-ignore
		delete (globalThis as any).showSaveFilePicker;
		const click = vi.fn();
		// stub URL object methods for jsdom
		const originalURL = URL;
		// @ts-ignore override URL
		(globalThis as any).URL = {
			...originalURL,
			createObjectURL: vi.fn(() => 'blob:mock'),
			revokeObjectURL: vi.fn()
		} as any;
		const originalCreate = document.createElement.bind(document);
		const create = vi.spyOn(document, 'createElement');

		create.mockImplementation(((tag: string) => {
			const el = originalCreate(tag);
			if (tag === 'a') {
				Object.defineProperty(el, 'click', { value: click });
			}
			return el as any;
		}) as any);

		await saveFile('hello');

		expect(click).toHaveBeenCalledOnce();
		expect((URL as any).revokeObjectURL).toHaveBeenCalledTimes(1);

		// restore URL
		// @ts-ignore restore URL
		(globalThis as any).URL = originalURL as any;
	});

	it('loadFile uses showOpenFilePicker when available (success)', async () => {
		resetDom();
		const text = vi.fn(async () => 'content');
		const getFile = vi.fn(async () => ({ text }));
		// @ts-ignore mock window
		(globalThis as any).showOpenFilePicker = vi.fn(async () => [{ getFile }]);

		const res = await loadFile();
		expect(res).toBe('content');

		// cleanup
		// @ts-ignore
		delete (globalThis as any).showOpenFilePicker;
	});

	it('loadFile falls back to input type=file and rejects when no file selected', async () => {
		resetDom();
		// @ts-ignore
		delete (globalThis as any).showOpenFilePicker;

		const originalCreate = document.createElement.bind(document);
		const create = vi.spyOn(document, 'createElement');

		create.mockImplementation(((tag: string) => {
			const el = originalCreate(tag) as HTMLInputElement;
			if (tag === 'input') {
				Object.defineProperty(el, 'click', {
					value: vi.fn(() => {
						// simulate change with no files selected
						setTimeout(() => el.onchange?.({ target: { files: [] } } as any), 0);
					})
				});
			}
			return el as any;
		}) as any);

		await expect(loadFile()).rejects.toThrow('No file selected');
	});

	it('loadFile falls back and resolves with file content when a file is selected', async () => {
		resetDom();
		// @ts-ignore ensure picker not available
		delete (globalThis as any).showOpenFilePicker;

		// Mock FileReader to trigger onload with content
		class FRMock {
			public onload: ((e: any) => void) | null = null;
			public onerror: ((e: any) => void) | null = null;
			readAsText(_: any) {
				setTimeout(() => this.onload && this.onload({ target: { result: 'file-content' } }), 0);
			}
		}
		vi.stubGlobal('FileReader', FRMock as any);

		const originalCreate = document.createElement.bind(document);
		const create = vi.spyOn(document, 'createElement');

		create.mockImplementation(((tag: string) => {
			const el = originalCreate(tag) as HTMLInputElement;
			if (tag === 'input') {
				Object.defineProperty(el, 'click', {
					value: vi.fn(() => {
						// simulate change with a selected file
						setTimeout(() => el.onchange?.({ target: { files: [{}] } } as any), 0);
					})
				});
			}
			return el as any;
		}) as any);

		const res = await loadFile();
		expect(res).toBe('file-content');
	});

	it('loadFile falls back and rejects when FileReader errors', async () => {
		resetDom();
		delete (globalThis as any).showOpenFilePicker;

		class FRErrorMock {
			public onload: ((e: any) => void) | null = null;
			public onerror: ((e: any) => void) | null = null;
			readAsText(_: any) {
				setTimeout(() => this.onerror && this.onerror(new Error('boom')), 0);
			}
		}
		vi.stubGlobal('FileReader', FRErrorMock as any);

		const originalCreate = document.createElement.bind(document);
		const create = vi.spyOn(document, 'createElement');

		create.mockImplementation(((tag: string) => {
			const el = originalCreate(tag) as HTMLInputElement;
			if (tag === 'input') {
				Object.defineProperty(el, 'click', {
					value: vi.fn(() => {
						// simulate change with a selected file
						setTimeout(() => el.onchange?.({ target: { files: [{}] } } as any), 0);
					})
				});
			}
			return el as any;
		}) as any);

		await expect(loadFile()).rejects.toThrow('Failed to read file');
	});
});

it('saveFile logs error when picker throws', async () => {
	resetDom();
	const err = new Error('picker-failed');
	const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
	(globalThis as any).showSaveFilePicker = vi.fn(async () => {
		throw err;
	});

	await saveFile('x');

	expect(spy).toHaveBeenCalledWith(err);

	// cleanup
	// @ts-ignore
	delete (globalThis as any).showSaveFilePicker;
	spy.mockRestore();
});
