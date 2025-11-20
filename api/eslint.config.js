import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
	js.configs.recommended,
	{
		ignores: ['dist/', 'node_modules/', '.svelte-kit/', '*.config.js', '*.config.mjs']
	},
	{
		files: ['src/**/*.{js,ts,mjs}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2022,
				project: './tsconfig.json'
			},
			globals: {
				...globals.node,
				...globals.es2022
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			...ts.configs.recommended.rules,
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/src/lib/*', '../src/*', '../../src/*'],
							message:
								'Backend must not import from frontend (src/lib/). Backend should be completely independent.'
						},
						{
							group: ['$lib/*', '$app/*'],
							message:
								'Backend must not use SvelteKit imports ($lib, $app). These are frontend-only.'
						}
					]
				}
			]
		}
	}
];
