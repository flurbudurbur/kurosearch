import type { RequestHandler } from '@sveltejs/kit';
import { randomInt } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { error } from '@sveltejs/kit';
import { encrypt, decrypt } from '$lib/server/crypto';

type TempFile = {
	filepath: string;
	expires: number;
	inUse: boolean;
};

const tempFiles: Map<string, TempFile> = new Map();

// In test environments, use shorter expiry (30 seconds) to prevent file accumulation
// In production, use 5 minutes
const EXPIRY_TIME = process.env.NODE_ENV === 'test' ? 30 * 1000 : 5 * 60 * 1000;

const generateOneTimeCode = () => {
	return String(randomInt(100000, 999999));
};

// Cleanup old files that weren't properly deleted
const cleanupExpiredFiles = async () => {
	const now = Date.now();
	const toDelete: string[] = [];

	for (const [code, entry] of tempFiles.entries()) {
		if (now > entry.expires && !entry.inUse) {
			toDelete.push(code);
		}
	}

	for (const code of toDelete) {
		const entry = tempFiles.get(code);
		if (entry) {
			try {
				await fs.unlink(entry.filepath);
			} catch (_err) {
				// File might already be deleted, ignore error
			}
			tempFiles.delete(code);
		}
	}
};

// Run periodic cleanup every minute to catch any leaked files
// Only start one interval
let cleanupInterval: NodeJS.Timeout | null = null;
if (!cleanupInterval) {
	cleanupInterval = setInterval(() => {
		cleanupExpiredFiles().catch((err) => {
			console.error('Error in periodic cleanup:', err);
		});
	}, 60 * 1000);

	// Don't keep Node.js process alive just for this cleanup
	if (cleanupInterval.unref) {
		cleanupInterval.unref();
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Clean up expired files before creating new ones to prevent accumulation
		await cleanupExpiredFiles();

		const file = await request.arrayBuffer();
		const buffer = Buffer.from(file);

		// Parse the settings JSON to re-encrypt it
		const settings = JSON.parse(buffer.toString('utf-8'));

		const code = generateOneTimeCode();
		const temporaryDirectory = await fs.realpath(os.tmpdir());
		const filepath = path.join(temporaryDirectory, `${code}.cfg`);

		// Encrypt the settings before writing to disk
		const encryptedBuffer = encrypt(settings, code);
		await fs.writeFile(filepath, encryptedBuffer);

		// expire in EXPIRY_TIME (30s for tests, 5min for production)
		tempFiles.set(code, {
			filepath,
			expires: Date.now() + EXPIRY_TIME,
			inUse: false
		});

		// cleanup after expiry
		setTimeout(async () => {
			const entry = tempFiles.get(code);
			if (entry && !entry.inUse) {
				try {
					await fs.unlink(filepath);
				} catch (err) {
					console.error('Error cleaning up temp file:', err);
				}
				tempFiles.delete(code);
			}
		}, EXPIRY_TIME);

		return new Response(JSON.stringify({ code }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Error in sync POST handler:', err);
		throw error(
			500,
			`Failed to generate sync code: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};

export const _getTempFile = (code: string): TempFile | undefined => {
	const entry = tempFiles.get(code);
	if (!entry) return undefined;
	if (Date.now() > entry.expires) {
		if (!entry.inUse) {
			fs.unlink(entry.filepath).catch(() => {});
			tempFiles.delete(code);
		}
		return undefined;
	}
	return entry;
};

export const _consumeTempFile = async (code: string): Promise<string | undefined> => {
	const entry = tempFiles.get(code);
	if (!entry) return undefined;

	if (entry.inUse) {
		return undefined;
	}

	if (Date.now() > entry.expires) {
		fs.unlink(entry.filepath).catch(() => {});
		tempFiles.delete(code);
		return undefined;
	}

	entry.inUse = true;

	try {
		// Read the encrypted file
		const encryptedBuffer = await fs.readFile(entry.filepath);

		// Decrypt the contents
		const decryptedData = decrypt(encryptedBuffer, code);
		const content = JSON.stringify(decryptedData);

		try {
			await fs.unlink(entry.filepath);
		} catch (err) {
			console.error('Error deleting temp file:', err);
		}
		tempFiles.delete(code);

		return content;
	} catch (err) {
		// If reading or decryption failed, still clean up
		fs.unlink(entry.filepath).catch(() => {});
		tempFiles.delete(code);
		throw err;
	}
};
