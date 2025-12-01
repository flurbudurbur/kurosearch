/**
 * Available accent colors for the theme
 */
export type Accent = 'crimson' | 'hotpink';

/**
 * Available theme modes
 */
export type ThemeMode = 'dark' | 'light' | 'coffee' | 'system';

/**
 * Complete theme string in format "accent mode"
 * Examples: "crimson dark", "hotpink light"
 */
export type Theme = `${Accent} ${ThemeMode}`;

/**
 * Parse a theme string into its components
 */
export function parseTheme(theme: string): { accent: Accent; mode: ThemeMode } | null {
	const parts = theme.split(' ');
	if (parts.length !== 2) return null;

	const [accent, mode] = parts;
	if (!isValidAccent(accent) || !isValidThemeMode(mode)) return null;

	return { accent, mode };
}

/**
 * Check if a string is a valid accent
 */
export function isValidAccent(value: string): value is Accent {
	return value === 'crimson' || value === 'hotpink';
}

/**
 * Check if a string is a valid theme mode
 */
export function isValidThemeMode(value: string): value is ThemeMode {
	return value === 'dark' || value === 'light' || value === 'coffee' || value === 'system';
}

/**
 * Create a theme string from accent and mode
 */
export function createTheme(accent: Accent, mode: ThemeMode): Theme {
	return `${accent} ${mode}`;
}
