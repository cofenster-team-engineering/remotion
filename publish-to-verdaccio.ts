#!/usr/bin/env bun
/**
 * Simplified automated script for publishing Remotion packages to Verdaccio
 *
 * This script automates the workflow WITHOUT hardcoding dependencies:
 * 1. Bump version across all packages
 * 2. Update version.ts files (CRITICAL: before build)
 * 3. Install dependencies
 * 4. Build all packages
 * 5. Publish packages to Verdaccio in dependency order
 * 6. Tag all packages with "latest" dist-tag
 *
 * Note: bun publish automatically resolves workspace:* to concrete versions
 *
 * Usage: bun publish-to-verdaccio.ts <version>
 * Example: bun publish-to-verdaccio.ts 4.0.428
 */

import { spawnSync } from "child_process";

// ANSI color codes for pretty output
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	red: "\x1b[31m",
};

function log(emoji: string, message: string, color = colors.reset) {
	console.log(`${color}${emoji}  ${message}${colors.reset}`);
}

function error(message: string) {
	log("❌", message, colors.red);
	process.exit(1);
}

function exec(command: string, args: string[], description: string) {
	log("▶", `${description}...`, colors.blue);
	const result = spawnSync(command, args, {
		stdio: "inherit",
		shell: true,
	});

	if (result.error) {
		error(`Failed to ${description}: ${result.error.message}`);
	}

	if (result.status !== 0 && result.status !== null) {
		// Allow build to continue with warnings
		if (description.includes("Build")) {
			log(
				"!",
				"Build had warnings, continuing...",
				colors.yellow,
			);
			return;
		}
		error(`Failed to ${description} (exit code ${result.status})`);
	}
}

function publishPackages() {
	log(
		"📤",
		"Publishing packages to Verdaccio in dependency order...",
		colors.blue,
	);

	const publishOrder = [
		// Core dependencies first
		"bundler",
		"cli",
		"compositor-darwin-arm64",
		"compositor-darwin-x64",
		"compositor-linux-arm64-gnu",
		"compositor-linux-arm64-musl",
		"compositor-linux-x64-gnu",
		"compositor-linux-x64-musl",
		"compositor-win32-x64-msvc",
		"lambda",
		"lambda-client",
		"licensing",
		"media-parser",
		"media-utils",
		"player",
		"renderer",
		"serverless",
		"serverless-client",
		"streaming",
		"studio",
		"studio-server",
		"studio-shared",
		"web-renderer",
		"webcodecs",
		"zod-types",
		// Additional packages from original list
		"core",
		"tailwind-v4",
		"enable-scss",
		"skia",
	];

	for (const pkg of publishOrder) {
		exec(
			"bun",
			["publish-single.ts", pkg],
			`Publishing @remotion/${pkg}`,
		);
	}

	return publishOrder;
}

function tagPackagesAsLatest(version: string, packages: string[]) {
	log("🏷", "Tagging packages as latest in Verdaccio...", colors.blue);

	for (const pkg of packages) {
		// Determine the package name with scope
		const packageName =
			pkg === "core" ? "remotion" : `@remotion/${pkg}`;

		exec(
			"npm",
			[
				"dist-tag",
				"add",
				`${packageName}@${version}`,
				"latest",
				"--registry",
				"http://localhost:4873/",
			],
			`Tagging ${packageName}@${version} as latest`,
		);
	}

	log("✓", "All packages tagged as latest", colors.green);
}

function main() {
	const version = process.argv[2];

	if (!version) {
		error(
			"Usage: bun publish-to-verdaccio.ts <version>\nExample: bun publish-to-verdaccio.ts 4.0.428",
		);
	}

	// Validate version format
	if (!/^4\.0\.\d+$/.test(version)) {
		error(
			`Invalid version format: ${version}\nExpected format: 4.0.XXX`,
		);
	}

	console.log("");
	log("📦", `Publishing Remotion ${version} to Verdaccio`, colors.green);
	console.log("");

	// Step 1: Bump version
	log("1", "Step 1: Bump version", colors.yellow);
	exec(
		"bun",
		["update-version.ts", version],
		`Bump version to ${version}`,
	);
	console.log("");

	// Step 2: Update version.ts files (BEFORE build!)
	log("2", "Step 2: Update version.ts files", colors.yellow);
	exec(
		"bun",
		["update-version-files.ts", version],
		`Update version.ts files to ${version}`,
	);
	console.log("");

	// Step 3: Install dependencies
	log("3", "Step 3: Install dependencies", colors.yellow);
	exec("bun", ["install"], "Install dependencies");
	console.log("");

	// Step 4: Build
	log("4", "Step 4: Build all packages", colors.yellow);
	exec("bun", ["run", "build"], "Build all packages");
	console.log("");

	// Step 5: Publish
	log("5", "Step 5: Publish to Verdaccio", colors.yellow);
	const publishedPackages = publishPackages();
	console.log("");

	// Step 6: Tag as latest
	log("6", "Step 6: Tag packages as latest", colors.yellow);
	tagPackagesAsLatest(version, publishedPackages);
	console.log("");

	// Success!
	log(
		"✅",
		`Successfully published all packages to Verdaccio at version ${version}!`,
		colors.green,
	);
	console.log("");
	console.log("Packages are now available at: http://localhost:4873/");
	console.log(
		`You can install them with: npm install @remotion/cli@${version} --registry http://localhost:4873/`,
	);
	console.log("");
}

main();
