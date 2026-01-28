import {existsSync, lstatSync, readFileSync, readdirSync, writeFileSync} from 'fs';
import path from 'path';
import {FEATURED_TEMPLATES} from './packages/create-video/src/templates.ts';

const version = process.argv[2];

if (!version) {
	throw new Error('Please specify a version: bun update-version.ts 4.0.408');
}

const dirs = readdirSync('packages')
	.filter((dir) =>
		lstatSync(path.join(process.cwd(), 'packages', dir)).isDirectory(),
	)
	.filter((dir) =>
		existsSync(path.join(process.cwd(), 'packages', dir, 'package.json')),
	);

let updated = 0;

for (const dir of dirs) {
	const localTemplates = FEATURED_TEMPLATES.map(
		(t) => t.templateInMonorepo,
	).filter(Boolean) as string[];
	if (localTemplates.includes(dir)) {
		continue;
	}

	const packageJsonPath = path.join(
		process.cwd(),
		'packages',
		dir,
		'package.json',
	);

	const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
	packageJson.version = version;
	writeFileSync(
		packageJsonPath,
		JSON.stringify(packageJson, null, '\t') + '\n',
	);
	updated++;
	console.log(`✓ Updated ${packageJson.name} to v${version}`);
}

console.log(`\n✅ Updated ${updated} packages to version ${version}`);
console.log(`\nNext: bun run build && bun publish.ts`);
