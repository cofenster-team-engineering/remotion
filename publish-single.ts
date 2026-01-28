import {$} from 'bun';
import path from 'path';

const packageName = process.argv[2];
if (!packageName) {
	throw new Error('Please specify a package name: bun publish-single.ts lambda-client');
}

const packagePath = path.join(process.cwd(), 'packages', packageName);
await $`bun publish --tolerate-republish --registry http://localhost:4873`.cwd(packagePath);
console.log(`✅ Published @remotion/${packageName}`);
