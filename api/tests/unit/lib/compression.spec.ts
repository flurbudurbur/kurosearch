import { describe, it, expect } from 'vitest';
import { compress, decompress } from '../../../src/lib/compression.js';

describe('compression', () => {
	describe('compress', () => {
		it('should compress a string to buffer', () => {
			const input = 'Hello, World!';
			const compressed = compress(input);

			expect(compressed).toBeInstanceOf(Buffer);
			expect(compressed.length).toBeLessThan(input.length + 100); // Allow some overhead
		});

		it('should compress large strings efficiently', () => {
			const input = 'A'.repeat(10000);
			const compressed = compress(input);

			expect(compressed).toBeInstanceOf(Buffer);
			expect(compressed.length).toBeLessThan(input.length);
		});

		it('should handle empty strings', () => {
			const input = '';
			const compressed = compress(input);

			expect(compressed).toBeInstanceOf(Buffer);
			expect(compressed.length).toBeGreaterThan(0);
		});

		it('should handle special characters', () => {
			const input = '🎉 Special chars: <>&"\'';
			const compressed = compress(input);

			expect(compressed).toBeInstanceOf(Buffer);
		});

		it('should produce different output for different inputs', () => {
			const input1 = 'Hello';
			const input2 = 'World';

			const compressed1 = compress(input1);
			const compressed2 = compress(input2);

			expect(compressed1.toString('hex')).not.toBe(compressed2.toString('hex'));
		});
	});

	describe('decompress', () => {
		it('should decompress a buffer to string', () => {
			const original = 'Hello, World!';
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});

		it('should handle large data', () => {
			const original = 'B'.repeat(50000);
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});

		it('should handle empty strings', () => {
			const original = '';
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});

		it('should handle special characters', () => {
			const original = '🚀 Unicode: 你好世界';
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});

		it('should handle JSON data', () => {
			const original = JSON.stringify({ foo: 'bar', nested: { value: 123 } });
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
			expect(JSON.parse(decompressed)).toEqual({ foo: 'bar', nested: { value: 123 } });
		});

		it('should fall back to UTF-8 decode on invalid compressed data', () => {
			// Create a buffer with valid UTF-8 but not valid gzip
			const invalidCompressed = Buffer.from('Not compressed data', 'utf-8');
			const result = decompress(invalidCompressed);

			expect(result).toBe('Not compressed data');
		});

		it('should handle XML data', () => {
			const original = '<?xml version="1.0"?><root><item>test</item></root>';
			const compressed = compress(original);
			const decompressed = decompress(compressed);

			expect(decompressed).toBe(original);
		});
	});

	describe('round-trip', () => {
		it('should handle compress -> decompress round-trip', () => {
			const testCases = [
				'Simple string',
				'{"json": "data", "number": 42}',
				'<?xml version="1.0"?><root/>',
				'Line 1\nLine 2\nLine 3',
				'Tabs\t\there',
				'🎨 Emojis 🚀 everywhere',
				'',
				'A'.repeat(1000)
			];

			testCases.forEach((testCase) => {
				const compressed = compress(testCase);
				const decompressed = decompress(compressed);
				expect(decompressed).toBe(testCase);
			});
		});

		it('should maintain data integrity across multiple compressions', () => {
			const original = 'Test data for multiple compressions';

			const compressed1 = compress(original);
			const decompressed1 = decompress(compressed1);

			const compressed2 = compress(decompressed1);
			const decompressed2 = decompress(compressed2);

			expect(decompressed1).toBe(original);
			expect(decompressed2).toBe(original);
		});
	});
});
