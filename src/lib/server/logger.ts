import pino from 'pino';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/**
 * Get the configured timezone from environment variable.
 * Defaults to 'UTC' if TZ is not set.
 * Supports IANA timezone format (e.g., 'Europe/Amsterdam', 'America/New_York')
 */
const timezone = env.TZ || 'UTC';

/**
 * Custom timestamp function that formats time in the configured timezone.
 * Returns ISO 8601 format with timezone offset.
 */
function customTimestamp() {
	const now = new Date();

	// Get timezone offset in minutes
	const getTimezoneOffset = (date: Date, tz: string): string => {
		// Format the date in both the target timezone and UTC
		const tzDate = new Date(
			date.toLocaleString('en-US', {
				timeZone: tz
			})
		);
		const utcDate = new Date(
			date.toLocaleString('en-US', {
				timeZone: 'UTC'
			})
		);

		// Calculate offset in minutes
		const offsetMs = tzDate.getTime() - utcDate.getTime();
		const offsetMinutes = Math.round(offsetMs / 60000);
		const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
		const offsetMins = Math.abs(offsetMinutes) % 60;

		const sign = offsetMinutes >= 0 ? '+' : '-';
		return `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
	};

	// Format the date in the configured timezone
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		fractionalSecondDigits: 3,
		hour12: false
	});

	const parts = formatter.formatToParts(now);
	const partsMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

	const offset = getTimezoneOffset(now, timezone);

	// Construct ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sss+HH:mm
	const isoString = `${partsMap.year}-${partsMap.month}-${partsMap.day}T${partsMap.hour}:${partsMap.minute}:${partsMap.second}.${partsMap.fractionalSecond}${offset}`;

	return `,"time":"${isoString}"`;
}

/**
 * Creates a Pino logger configured for the current environment.
 * - Development: Pretty-printed output for readability
 * - Production: JSON output for Docker logs and log aggregation
 *
 * Environment Variables:
 * - LOG_LEVEL: Set log level (debug, info, warn, error). Defaults to 'debug' in dev, 'info' in production.
 * - TZ: Set timezone for log timestamps (e.g., 'Europe/Amsterdam', 'America/New_York'). Defaults to 'UTC'.
 */
export const logger = pino({
	level: env.LOG_LEVEL || (dev ? 'debug' : 'info'),
	transport: dev
		? {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: `SYS:yyyy-mm-dd HH:MM:ss.l o`,
					ignore: 'pid,hostname'
				}
			}
		: undefined,
	formatters: {
		level: (label) => {
			return { level: label };
		}
	},
	timestamp: customTimestamp
});

/**
 * Creates a child logger with additional context
 * @param context - Additional context to include in all log entries
 */
export function createLogger(context: Record<string, unknown>) {
	return logger.child(context);
}
