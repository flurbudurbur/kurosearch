import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';
import { getEnvFromProcess } from '../config/env.js';

/**
 * Session-scoped temporary encryption secret
 * Generated once per server session if SYNC_ENCRYPTION_SECRET is not set
 */
let temporarySessionSecret: string | null = null;

/**
 * Gets or generates a temporary session secret
 * This is used for development when SYNC_ENCRYPTION_SECRET is not set
 */
function getTemporarySessionSecret(): string {
	if (!temporarySessionSecret) {
		temporarySessionSecret = randomBytes(32).toString('base64');
		console.warn('[Crypto] ⚠️  SYNC_ENCRYPTION_SECRET not set - using temporary session secret');
		console.warn('[Crypto] ⚠️  Sync codes will only work within this server session');
		console.warn(
			'[Crypto] ⚠️  For production, set SYNC_ENCRYPTION_SECRET: openssl rand -base64 32'
		);
	}
	return temporarySessionSecret;
}

/**
 * Derives an encryption key from a sync code and server secret
 * @param syncCode - The 6-digit sync code
 * @param secret - Optional secret override (for testing)
 * @returns 32-byte encryption key
 */
function deriveKey(syncCode: string, secret?: string): Buffer {
	const env = getEnvFromProcess();
	const serverSecret = secret || env.SYNC_ENCRYPTION_SECRET || getTemporarySessionSecret();

	// Use PBKDF2 to derive a key from the sync code + secret
	// 100,000 iterations for security, 32 bytes for AES-256
	return pbkdf2Sync(syncCode + serverSecret, 'kurosearch-sync', 100000, 32, 'sha256');
}

/**
 * Encrypts data using AES-256-GCM
 * @param data - The data to encrypt (will be JSON stringified)
 * @param syncCode - The sync code used for key derivation
 * @param secret - Optional secret override (for testing)
 * @returns Buffer containing: [iv (12 bytes)][authTag (16 bytes)][encrypted data]
 */
export function encrypt(data: unknown, syncCode: string, secret?: string): Buffer {
	const key = deriveKey(syncCode, secret);
	const iv = randomBytes(12); // 12 bytes is recommended for GCM

	const cipher = createCipheriv('aes-256-gcm', key, iv);

	const jsonData = JSON.stringify(data);
	const encrypted = Buffer.concat([cipher.update(jsonData, 'utf8'), cipher.final()]);

	const authTag = cipher.getAuthTag();

	// Combine iv, authTag, and encrypted data into single buffer
	return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypts data using AES-256-GCM
 * @param encryptedBuffer - Buffer containing: [iv (12 bytes)][authTag (16 bytes)][encrypted data]
 * @param syncCode - The sync code used for key derivation
 * @param secret - Optional secret override (for testing)
 * @returns Decrypted and parsed JSON data
 */
export function decrypt(encryptedBuffer: Buffer, syncCode: string, secret?: string): unknown {
	const key = deriveKey(syncCode, secret);

	// Extract components from the buffer
	const iv = encryptedBuffer.subarray(0, 12);
	const authTag = encryptedBuffer.subarray(12, 28);
	const encrypted = encryptedBuffer.subarray(28);

	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

	return JSON.parse(decrypted.toString('utf8'));
}
