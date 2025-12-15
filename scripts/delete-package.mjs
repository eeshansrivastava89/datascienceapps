#!/usr/bin/env node

/**
 * Delete Package Script
 * 
 * Removes all files created by create-package.mjs:
 * - packages/{name}/
 * - src/pages/projects/{name}.astro
 * - packages/shared/src/data/projects/{name}.yaml
 * - analytics/notebooks/{name}/
 * - src/content/post/{name}-getting-started.md
 * 
 * Usage: node scripts/delete-package.mjs <package-name>
 */

import fs from 'fs'
import path from 'path'

const packageName = process.argv[2]

if (!packageName) {
	console.error('❌ Usage: node scripts/delete-package.mjs <package-name>')
	process.exit(1)
}

// Protect ab-simulator from accidental deletion
if (packageName === 'ab-simulator') {
	console.error('❌ Cannot delete ab-simulator (protected)')
	process.exit(1)
}

const paths = [
	{ path: `packages/${packageName}`, type: 'dir' },
	{ path: `src/pages/projects/${packageName}.astro`, type: 'file' },
	{ path: `packages/shared/src/data/projects/${packageName}.yaml`, type: 'file' },
	{ path: `analytics/notebooks/${packageName}`, type: 'dir' },
	{ path: `src/content/post/${packageName}-getting-started.md`, type: 'file' }
]

let found = false

console.log(`\n🗑️  Deleting package: ${packageName}\n`)

for (const { path: p, type } of paths) {
	const fullPath = path.join(process.cwd(), p)
	if (fs.existsSync(fullPath)) {
		if (type === 'dir') {
			fs.rmSync(fullPath, { recursive: true })
		} else {
			fs.unlinkSync(fullPath)
		}
		console.log(`  ✓ Deleted ${p}`)
		found = true
	}
}

if (!found) {
	console.log(`  ⚠️  No files found for package "${packageName}"`)
} else {
	console.log(`\n✅ Package deleted. Run 'pnpm install' to update lockfile.\n`)
}
