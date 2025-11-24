import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

import {
	CATEGORY_STYLES,
	LABEL_CATEGORY_MAP,
	LABEL_DIFFICULTY_MAP,
	LABEL_PROJECT_MAP,
	POINTS_PREFIX
} from '../src/data/build-with-me-config.js'

dotenv.config()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'eeshansrivastava89'
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'soma-portfolio'
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', 'build-with-me-data.json')
const FALLBACK_JSON = path.join(process.cwd(), 'src', 'data', 'build-with-me-data.json')

if (!GITHUB_TOKEN) {
	console.warn('GITHUB_TOKEN not set; using existing cached data.')
	process.exit(0)
}

const headers = {
	Accept: 'application/vnd.github+json',
	Authorization: `Bearer ${GITHUB_TOKEN}`,
	'User-Agent': 'build-with-me-fetch'
}

const fetchJson = async (url) => {
	const res = await fetch(url, { headers })
	if (!res.ok) {
		throw new Error(`GitHub request failed ${res.status}: ${await res.text()}`)
	}
	return res.json()
}

const fetchAllIssues = async () => {
	const issues = []
	let page = 1
	while (true) {
		const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&per_page=100&page=${page}`
		const chunk = await fetchJson(url)
		const filtered = chunk.filter((item) => !item.pull_request) // ignore PRs in this list
		issues.push(...filtered)
		if (chunk.length < 100) break
		page++
	}
	return issues
}

const fetchAllPRs = async () => {
	const prs = []
	let page = 1
	while (true) {
		const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all&per_page=100&page=${page}`
		const chunk = await fetchJson(url)
		prs.push(...chunk)
		if (chunk.length < 100) break
		page++
	}
	return prs
}

const mapLabels = (labels) => {
	const cats = new Set()
	let difficulty
	let points
	let projectSlug = 'ab-sim'

	for (const l of labels) {
		const name = l.name || ''
		if (LABEL_CATEGORY_MAP[name]) cats.add(LABEL_CATEGORY_MAP[name])
		if (LABEL_DIFFICULTY_MAP[name]) difficulty = LABEL_DIFFICULTY_MAP[name]
		if (LABEL_PROJECT_MAP[name]) projectSlug = LABEL_PROJECT_MAP[name]
		if (name.startsWith(POINTS_PREFIX)) {
			const val = parseInt(name.replace(POINTS_PREFIX, ''), 10)
			if (!Number.isNaN(val)) points = val
		}
	}

	return {
		category: Array.from(cats),
		difficulty,
		points,
		projectSlug
	}
}

const mapStatus = (issue, prIndex) => {
	if (issue.state === 'closed') return 'merged'
	if (prIndex.has(issue.number)) {
		const pr = prIndex.get(issue.number)
		if (pr.merged_at) return 'merged'
		if (pr.state === 'open') return 'in-review'
		return 'claimed'
	}
	if (issue.assignee) return 'claimed'
	return 'open'
}

const buildTasks = (issues, prs) => {
	const prIndex = new Map()
	prs.forEach((pr) => prIndex.set(pr.number, pr))

	return issues.map((issue) => {
		const { category, difficulty, points, projectSlug } = mapLabels(issue.labels)
		const status = mapStatus(issue, prIndex)
		const assignees = issue.assignee ? [{ name: issue.assignee.login }] : undefined
		const labels = issue.labels.map((l) => l.name || '').filter(Boolean)

		return {
			id: String(issue.number),
			title: issue.title,
			projectSlug,
			category: category.length ? category : ['frontend'],
			status,
			difficulty,
			points,
			assignees,
			labels,
			githubUrl: issue.html_url
		}
	})
}

const buildHats = (tasks) => {
	const hats = []
	tasks.forEach((task) => {
		if (task.assignees) {
			task.assignees.forEach((a) => {
				hats.push({
					name: a.name,
					hats: task.category,
					status: task.status,
					prNumber: undefined
				})
			})
		}
	})
	return hats
}

const summarizeCycles = (tasks) => {
	const byProject = {}
	tasks.forEach((task) => {
		const bucket = byProject[task.projectSlug] || { open: 0, claimed: 0, merged: 0 }
		if (task.status === 'merged') bucket.merged += 1
		else if (task.status === 'claimed' || task.status === 'in-review') bucket.claimed += 1
		else bucket.open += 1
		byProject[task.projectSlug] = bucket
	})
	return Object.entries(byProject).map(([slug, stats]) => ({
		slug,
		name: slug === 'ab-sim' ? 'A/B Simulator' : slug === 'basketball' ? 'Basketball Shot Analyzer' : slug,
		phase: 'Active',
		openTasks: stats.open,
		claimed: stats.claimed,
		mergedThisWeek: stats.merged,
		highlight: stats.merged ? `${stats.merged} merged this week` : undefined
	}))
}

const buildLeaderboard = (tasks) => {
	const map = new Map()
	tasks.forEach((task) => {
		if (task.assignees) {
			task.assignees.forEach((a) => {
				const current = map.get(a.name) || {
					name: a.name,
					points: 0,
					mergedPRs: 0,
					reviews: 0,
					docs: 0
				}
				current.points += task.points || 1
				if (task.status === 'merged') current.mergedPRs += 1
				map.set(a.name, current)
			})
		}
	})
	return Array.from(map.values()).sort((a, b) => b.points - a.points)
}

const main = async () => {
	try {
		const [issues, prs] = await Promise.all([fetchAllIssues(), fetchAllPRs()])
		const tasks = buildTasks(issues, prs)
		const hats = buildHats(tasks)
		const cycles = summarizeCycles(tasks)
		const leaderboard = buildLeaderboard(tasks)

		const payload = {
			cycles,
			tasks,
			hats,
			leaderboard,
			upcoming: [
				{ name: 'Metal Lyrics NLP', skills: ['NLP', 'Python', 'Genius API'], eta: 'TBD', note: 'Classifiers + topic modeling' },
				{ name: 'Finance Dashboard', skills: ['ETL', 'Charts', 'Plaid'], eta: 'TBD', note: 'Spending classification' }
			]
		}

		fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2))
		console.log(`Wrote data to ${OUTPUT_PATH}`)
	} catch (err) {
		console.error('Failed to fetch from GitHub:', err)
		if (fs.existsSync(FALLBACK_JSON)) {
			console.log('Keeping existing cached data.')
		}
		process.exit(1)
	}
}

main()
