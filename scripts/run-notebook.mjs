#!/usr/bin/env node

/**
 * Run Notebook Script
 *
 * Local equivalent of .github/workflows/notebooks.yml
 * Executes notebooks with papermill, converts to HTML, outputs to public/analysis/
 *
 * Usage:
 *   node scripts/run-notebook.mjs                     # Run all notebooks
 *   node scripts/run-notebook.mjs ab-simulator        # Run notebooks in folder
 *   node scripts/run-notebook.mjs --list              # List available notebooks
 *   node scripts/run-notebook.mjs --check             # Check env and deps only
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const NOTEBOOKS_DIR = path.join(ROOT, 'analytics', 'notebooks')
const REQUIREMENTS = path.join(ROOT, 'analytics', 'requirements.txt')

const green = (s) => `\x1b[32m✓\x1b[0m ${s}`
const red = (s) => `\x1b[31m✗\x1b[0m ${s}`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

// Load .env file into process.env
function loadEnv() {
	const envPath = path.join(ROOT, '.env')
	if (!fs.existsSync(envPath)) return

	const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
	let count = 0
	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const [key, ...rest] = trimmed.split('=')
		if (key && !process.env[key.trim()]) {
			process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
			count++
		}
	}
	if (count) console.log(dim(`Loaded ${count} env vars from .env`))
}

// Check required env vars
function checkEnv() {
	const required = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY']
	let ok = true
	console.log('\nEnvironment:')
	for (const key of required) {
		if (process.env[key]) {
			console.log(green(key))
		} else {
			console.log(red(`${key} not set`))
			ok = false
		}
	}
	if (!ok) {
		console.log('\nCreate .env file with:\n  PUBLIC_SUPABASE_URL=...\n  PUBLIC_SUPABASE_ANON_KEY=...')
	}
	return ok
}

// Install dependencies
function installDeps() {
	console.log('\nDependencies:')
	console.log(dim(`Installing from analytics/requirements.txt`))
	try {
		execSync(`pip install -q -r "${REQUIREMENTS}"`, { stdio: 'inherit' })
		console.log(green('Installed'))
		return true
	} catch (err) {
		console.log(red('Failed to install'))
		if (err.message) console.log(dim(`  ${err.message}`))
		return false
	}
}

// Find notebooks
function findNotebooks(target) {
	const notebooks = []

	function scan(dir) {
		if (!fs.existsSync(dir)) return
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				scan(full)
			} else if (entry.name.endsWith('.ipynb') && !entry.name.includes('.out.')) {
				notebooks.push(full)
			}
		}
	}

	if (!target) {
		scan(NOTEBOOKS_DIR)
	} else {
		const asPath = path.join(NOTEBOOKS_DIR, target)
		if (fs.existsSync(asPath) && fs.statSync(asPath).isDirectory()) {
			scan(asPath)
		} else if (fs.existsSync(target) && target.endsWith('.ipynb')) {
			notebooks.push(target)
		} else {
			console.log(red(`Not found: ${target}`))
			process.exit(1)
		}
	}
	return notebooks
}

// Run single notebook (matches workflow: papermill -> nbconvert)
function runNotebook(notebookPath) {
	const rel = path.relative(ROOT, notebookPath)
	const projectId = rel.split(path.sep)[2] // analytics/notebooks/{projectId}/...
	const baseName = path.basename(notebookPath, '.ipynb')
	const notebookId = baseName.replace(/_/g, '-')

	const executedPath = `/tmp/${notebookId}-executed.ipynb`
	const outputDir = path.join(ROOT, 'public', 'analysis', projectId)

	console.log(`\n${dim('Running:')} ${rel}`)

	try {
		// Step 1: Execute with papermill
		execSync(`papermill "${notebookPath}" "${executedPath}" --no-progress-bar --log-output`, {
			stdio: 'inherit',
			cwd: ROOT,
			env: process.env
		})

		// Step 2: Convert to HTML with lab template
		fs.mkdirSync(outputDir, { recursive: true })
		execSync(`jupyter nbconvert "${executedPath}" --to html --template lab --output "${notebookId}" --output-dir "${outputDir}"`, {
			stdio: 'inherit',
			cwd: ROOT,
			env: process.env
		})

		console.log(green(`public/analysis/${projectId}/${notebookId}.html`))
		return true
	} catch (err) {
		console.log(red('Failed'))
		if (err.message) console.log(dim(`  ${err.message}`))
		return false
	}
}

// Main
loadEnv()

const arg = process.argv[2]

if (arg === '--list') {
	console.log('Notebooks:')
	for (const nb of findNotebooks()) {
		console.log(`  ${path.relative(NOTEBOOKS_DIR, nb)}`)
	}
	process.exit(0)
}

if (arg === '--check') {
	const ok = checkEnv() && installDeps()
	process.exit(ok ? 0 : 1)
}

if (arg === '--help' || arg === '-h') {
	console.log(`Usage: node scripts/run-notebook.mjs [target]

  <none>          Run all notebooks
  <folder>        Run notebooks in folder (e.g., ab-simulator)
  --list          List notebooks
  --check         Check env and install deps`)
	process.exit(0)
}

if (!checkEnv() || !installDeps()) process.exit(1)

const notebooks = findNotebooks(arg)
if (!notebooks.length) {
	console.log('No notebooks found')
	process.exit(0)
}

console.log(`\nRunning ${notebooks.length} notebook(s)`)
let failed = 0
for (const nb of notebooks) {
	if (!runNotebook(nb)) failed++
}

console.log('')
if (failed) {
	console.log(red(`${failed} failed`))
	process.exit(1)
}
console.log(green('All done'))
