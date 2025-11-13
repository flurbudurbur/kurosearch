import pako from 'pako';
import { logger } from './logger';

/**
 * Compress a string using gzip compression
 * @param data The string to compress
 * @returns Compressed data as a Buffer
 */
export function compress(data: string): Buffer {
	try {
		const uint8Array = pako.gzip(data);
		return Buffer.from(uint8Array);
	} catch (err) {
		logger.error({ err }, 'Compression error');
		throw new Error(
			`Failed to compress data: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
}

/**
 * Decompress gzip-compressed data back to a string
 * @param buffer The compressed data as a Buffer
 * @returns Decompressed string
 */
export function decompress(buffer: Buffer): string {
	try {
		const uint8Array = new Uint8Array(buffer);
		return pako.ungzip(uint8Array, { to: 'string' });
	} catch (err) {
		logger.error({ err }, 'Decompression error');
		// If decompression fails, try to return the buffer as a string (fallback for uncompressed data)
		try {
			return buffer.toString('utf-8');
		} catch (_fallbackErr) {
			throw new Error(
				`Failed to decompress data: ${err instanceof Error ? err.message : 'Unknown error'}`
			);
		}
	}
}
