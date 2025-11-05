import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read the icons.ts file
const iconsFilePath = join(projectRoot, 'src/lib/components/pure/icon/icons.ts');
const iconsContent = readFileSync(iconsFilePath, 'utf-8');

// Extract all icon keys from the iconRegistry
const iconKeys = [];
const registryMatch = iconsContent.match(/export const iconRegistry[^{]*\{([^}]+)\}/s);
if (registryMatch) {
	const registryContent = registryMatch[1];
	const keyMatches = registryContent.matchAll(/['"]([^'"]+)['"]\s*:/g);
	for (const match of keyMatches) {
		iconKeys.push(match[1]);
	}
}

console.log(`Found ${iconKeys.length} icon keys in the registry\n`);

// Check each icon key usage in the codebase
const unusedIcons = [];
const usedIcons = [];

for (const iconKey of iconKeys) {
	try {
		// Search for the icon key in the codebase (excluding the icons.ts file itself and node_modules)
		// We need to escape special characters for grep
		const escapedKey = iconKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		// Use git grep if available, otherwise use regular grep
		let result;
		try {
			result = execSync(
				`git grep -l "${escapedKey}" -- "*.svelte" "*.ts" "*.js" ":!src/lib/components/pure/icon/icons.ts"`,
				{ cwd: projectRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
			);
		} catch (gitError) {
			// If git grep fails, the icon is not found (exit code 1 means no matches)
			if (gitError.status === 1) {
				result = '';
			} else {
				throw gitError;
			}
		}

		if (result.trim()) {
			usedIcons.push({ key: iconKey, files: result.trim().split('\n') });
		} else {
			unusedIcons.push(iconKey);
		}
	} catch (error) {
		console.error(`Error checking icon "${iconKey}":`, error.message);
	}
}

// Display results
console.log('='.repeat(60));
console.log('UNUSED ICONS');
console.log('='.repeat(60));
if (unusedIcons.length > 0) {
	console.log(`\nFound ${unusedIcons.length} unused icons:\n`);
	unusedIcons.forEach((icon) => {
		console.log(`  - ${icon}`);
	});
} else {
	console.log('\n✓ All icons are being used!');
}

console.log('\n' + '='.repeat(60));
console.log('USED ICONS');
console.log('='.repeat(60));
console.log(`\nFound ${usedIcons.length} used icons:\n`);
usedIcons.forEach(({ key, files }) => {
	console.log(`  ✓ ${key} (used in ${files.length} file${files.length > 1 ? 's' : ''})`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Total icons: ${iconKeys.length}`);
console.log(
	`Used: ${usedIcons.length} (${Math.round((usedIcons.length / iconKeys.length) * 100)}%)`
);
console.log(
	`Unused: ${unusedIcons.length} (${Math.round((unusedIcons.length / iconKeys.length) * 100)}%)`
);
