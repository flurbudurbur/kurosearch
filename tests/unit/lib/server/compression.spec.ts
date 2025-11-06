import { describe, it, expect, vi } from 'vitest';
import { compress, decompress } from '$lib/server/compression';
import pako from 'pako';

describe('compression', () => {
	describe('compress', () => {
		it('should compress a string successfully', () => {
			const data = 'Hello, World!';
			const compressed = compress(data);

			expect(compressed).toBeInstanceOf(Buffer);
			expect(compressed.length).toBeGreaterThan(0);
		});

		it('should compress empty string', () => {
			const data = '';
			const compressed = compress(data);

			expect(compressed).toBeInstanceOf(Buffer);
		});

		it('should compress large string', () => {
			const data = 'a'.repeat(10000);
			const compressed = compress(data);

			expect(compressed).toBeInstanceOf(Buffer);
			// Compressed should be smaller than original
			expect(compressed.length).toBeLessThan(data.length);
		});

		it('should throw error when pako.gzip fails', () => {
			const gzipSpy = vi.spyOn(pako, 'gzip');
			gzipSpy.mockImplementation(() => {
				throw new Error('Compression failed');
			});

			expect(() => compress('test')).toThrow('Failed to compress data: Compression failed');

			gzipSpy.mockRestore();
		});

		it('should handle non-Error objects thrown by pako', () => {
			const gzipSpy = vi.spyOn(pako, 'gzip');
			gzipSpy.mockImplementation(() => {
				throw 'string error';
			});

			expect(() => compress('test')).toThrow('Failed to compress data: Unknown error');

			gzipSpy.mockRestore();
		});
	});

	describe('decompress', () => {
		it('should decompress data successfully', () => {
			const original = 'Hello, World!';
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});

		it('should decompress empty string', () => {
			const original = '';
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});

		it('should decompress large string', () => {
			const original = 'abcdefghij'.repeat(1000);
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});

		it('should fallback to utf-8 string when decompression fails', () => {
			const uncompressedBuffer = Buffer.from('plain text', 'utf-8');
			const decompressed = decompress(uncompressedBuffer);

			expect(decompressed).toBe('plain text');
		});

		it('should throw error when both decompression and fallback fail', () => {
			const ungzipSpy = vi.spyOn(pako, 'ungzip');
			ungzipSpy.mockImplementation(() => {
				throw new Error('Decompression failed');
			});

			// Create a buffer that will fail both ungzip and toString
			const invalidBuffer = Buffer.from([0xff, 0xfe, 0xfd]);

			// Mock toString to fail as well
			const toStringSpy = vi.spyOn(invalidBuffer, 'toString');
			toStringSpy.mockImplementation(() => {
				throw new Error('toString failed');
			});

			expect(() => decompress(invalidBuffer)).toThrow('Failed to decompress data');

			ungzipSpy.mockRestore();
			toStringSpy.mockRestore();
		});

		it('should handle non-Error objects thrown by pako during decompression', () => {
			const ungzipSpy = vi.spyOn(pako, 'ungzip');
			ungzipSpy.mockImplementation(() => {
				throw 'string error';
			});

			// This should fallback to utf-8 string
			const buffer = Buffer.from('text', 'utf-8');
			const result = decompress(buffer);

			expect(result).toBe('text');

			ungzipSpy.mockRestore();
		});

		it('should round-trip compress and decompress complex data', () => {
			const original = JSON.stringify({
				name: 'test',
				value: 123,
				nested: { array: [1, 2, 3] }
			});
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});
	});
});
