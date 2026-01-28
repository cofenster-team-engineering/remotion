# Publishing Remotion to Verdaccio

This guide describes how to properly build and publish Remotion packages to a local Verdaccio registry.

## Prerequisites

- Verdaccio running at `http://localhost:4873/`
- Bun installed and configured

## Setup

### Configure .npmrc for Verdaccio

Add the following lines to your `.npmrc` file in the Remotion repository root:

```ini
# Verdaccio local registry configuration
registry=http://localhost:4873/
@remotion:registry=http://localhost:4873/
```

This configures npm/bun to:
- Use Verdaccio as the default registry for all packages
- Use Verdaccio specifically for @remotion scoped packages

### Test Verdaccio Connection

Before publishing, verify that Verdaccio is working correctly:

#### 1. Check Verdaccio Service

```bash
curl -s http://localhost:4873/
```

**Expected:** HTML response showing Verdaccio web interface.

#### 2. Test Registry Ping

```bash
curl -s http://localhost:4873/-/ping
```

**Expected:** `{}` (empty JSON object).

#### 3. Verify Authentication

```bash
npm whoami --registry http://localhost:4873/
```

**Expected:** Your Verdaccio username.

#### 4. Check Registry Configuration

```bash
npm config get registry
```

**Expected:** `http://localhost:4873/`

#### 5. Search for Existing Packages

```bash
npm view @remotion/cli version --registry http://localhost:4873/
```

**Expected:** Latest published version number (e.g., `4.0.428`) or error if not yet published.

If all tests pass, you're ready to publish packages to Verdaccio.

## Important Concepts

### Version Management

**CRITICAL**: Verdaccio does not replace existing tarballs when using `--tolerate-republish`. You MUST bump the version number whenever you make code changes, even if you've already published that version before.

### Dependency Resolution with `workspace:*`

**Good news**: You can use `workspace:*` without any manual intervention!

When you run `bun publish`, it automatically:
1. Resolves `workspace:*` to the actual version from the workspace
2. Creates the tarball with concrete version numbers
3. Publishes with properly resolved dependencies

**Example:**
```json
// In your package.json (during development)
{
  "dependencies": {
    "@remotion/renderer": "workspace:*"
  }
}

// After bun publish (in the published tarball)
{
  "dependencies": {
    "@remotion/renderer": "4.0.428"
  }
}
```

This means you can keep `workspace:*` in your package.json files and let `bun publish` handle the resolution automatically. **No manual hardcoding required!**

## Automated Publishing Script (Recommended)

**💡 Quick Start**: Use the automated script - it handles everything for you!

```bash
bun publish-to-verdaccio.ts <version>
```

**Example:**
```bash
bun publish-to-verdaccio.ts 4.0.428
```

### What the Script Does

The script automates the entire workflow in 6 steps:

1. **Bumps version** across all 83 packages using `update-version.ts`
2. **Updates version.ts files** in core and media-parser packages using `update-version-files.ts` (CRITICAL: ensures bundled VERSION constant is correct)
3. **Installs dependencies** to ensure all packages are up to date
4. **Builds all packages** using `bun run build`
5. **Publishes packages** to Verdaccio in the correct dependency order using `publish-single.ts`:
   - Core packages: renderer, bundler, media-utils, player, studio-shared, studio-server, studio, lambda-client, core, serverless
   - CLI dev dependencies: zod-types, tailwind-v4, enable-scss, skia
   - Main packages: cli, lambda
6. **Tags all packages** with "latest" dist-tag to ensure version consistency

### Script Output

The script provides colored, step-by-step output:

```
📦  Publishing Remotion 4.0.428 to Verdaccio

1️⃣  Step 1: Bump version
▶️  Bump version to 4.0.428...
✓ Updated 83 packages to version 4.0.428

2️⃣  Step 2: Update version.ts files
▶️  Update version.ts files to 4.0.428...
✓ Updated 2 version.ts files

3️⃣  Step 3: Install dependencies
▶️  Install dependencies...

4️⃣  Step 4: Build all packages
▶️  Build all packages...
⚠️  Build had warnings, continuing...

5️⃣  Step 5: Publish to Verdaccio
▶️  Publishing @remotion/renderer...
✓ Published @remotion/renderer
[...]

6️⃣  Step 6: Tag packages as latest
🏷️  Tagging packages as latest in Verdaccio...
▶️  Tagging @remotion/renderer@4.0.428 as latest...
✓ All packages tagged as latest

✅  Successfully published all packages to Verdaccio at version 4.0.428!
```

### Why Use the Script?

- **Consistent**: Always follows the correct order and includes all necessary packages
- **Safe**: Validates version format before starting
- **Simple**: No manual hardcoding or dependency management needed
- **Fast**: No manual intervention needed
- **Reliable**: Handles build warnings gracefully
- **Clear**: Colored output shows progress and errors clearly

## Manual Publishing (For Reference Only)

If you need to understand the individual steps or run them manually:

### 1. Bump Version Number

```bash
bun update-version.ts 4.0.XXX
```

Replace `XXX` with the next version number (e.g., 4.0.427 → 4.0.428).

### 2. Update version.ts Files

```bash
bun update-version-files.ts 4.0.XXX
```

This updates `packages/core/src/version.ts` and `packages/media-parser/src/version.ts` to ensure the correct VERSION constant is bundled.

### 3. Install Dependencies

```bash
bun install
```

### 4. Build All Packages

```bash
bun run build
```

### 5. Publish Packages in Order

Publish packages in dependency order using the `publish-single.ts` script:

```bash
# Core dependencies (publish first)
bun publish-single.ts renderer
bun publish-single.ts bundler
bun publish-single.ts media-utils
bun publish-single.ts player
bun publish-single.ts studio-shared
bun publish-single.ts studio-server
bun publish-single.ts studio
bun publish-single.ts lambda-client
bun publish-single.ts core
bun publish-single.ts serverless

# CLI dev dependencies
bun publish-single.ts zod-types
bun publish-single.ts tailwind-v4
bun publish-single.ts enable-scss
bun publish-single.ts skia

# Main packages (publish last)
bun publish-single.ts cli
bun publish-single.ts lambda
```

### 6. Tag Packages as Latest

```bash
npm dist-tag add @remotion/renderer@4.0.XXX latest --registry http://localhost:4873/
npm dist-tag add @remotion/cli@4.0.XXX latest --registry http://localhost:4873/
# ... repeat for all published packages
```
