#!/usr/bin/env bun
/**
 * Updates version.ts files in packages that export VERSION constants
 * This must run BEFORE building packages to ensure correct version is bundled
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

const version = process.argv[2];

if (!version) {
	throw new Error(
		"Please specify a version: bun update-version-files.ts 4.0.425",
	);
}

// Packages that have version.ts files that need to be updated
const packagesWithVersionFiles = [
	{
		name: "remotion (core)",
		path: "packages/core/src/version.ts",
		template: `// Automatically generated on publish

/**
 * @description Provides the current version number of the Remotion library.
 * @see [Documentation](https://remotion.dev/docs/version)
 * @returns {string} The current version of the remotion package
 */
export const VERSION = '${version}';
`,
	},
	{
		name: "@remotion/media-parser",
		path: "packages/media-parser/src/version.ts",
		template: `// Automatically generated on publish
export const VERSION = '${version}';
`,
	},
];

for (const pkg of packagesWithVersionFiles) {
	const fullPath = path.join(process.cwd(), pkg.path);
	writeFileSync(fullPath, pkg.template);
	console.log(`✓ Updated ${pkg.name} version.ts to ${version}`);
}

console.log(`\n✅ Updated ${packagesWithVersionFiles.length} version.ts files`);
