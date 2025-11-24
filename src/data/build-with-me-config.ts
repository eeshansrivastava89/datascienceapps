export type Category = 'frontend' | 'backend' | 'analytics' | 'wiring' | 'docs'
export type Status = 'open' | 'claimed' | 'in-review' | 'merged'
export type Difficulty = 'easy' | 'medium' | 'hard'

// Style tokens for category/status chips; edit here to retheme.
export const CATEGORY_STYLES: Record<Category, string> = {
	frontend: 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/30',
	backend: 'bg-amber-400/10 text-amber-100 border border-amber-400/30',
	analytics: 'bg-orange-500/10 text-orange-100 border border-orange-500/30',
	wiring: 'bg-violet-500/10 text-violet-100 border border-violet-500/30',
	docs: 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/30'
}

export const STATUS_STYLES: Record<Status, string> = {
	open: 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/30',
	claimed: 'bg-amber-500/10 text-amber-100 border border-amber-500/30',
	'in-review': 'bg-sky-500/10 text-sky-100 border border-sky-500/30',
	merged: 'bg-emerald-600/20 text-emerald-50 border border-emerald-500/40'
}

// Label maps for GitHub integration; adjust here to change label semantics.
export const LABEL_CATEGORY_MAP: Record<string, Category> = {
	'cat:frontend': 'frontend',
	'cat:backend': 'backend',
	'cat:analytics': 'analytics',
	'cat:wiring': 'wiring',
	'cat:docs': 'docs'
}

export const LABEL_DIFFICULTY_MAP: Record<string, Difficulty> = {
	'diff:easy': 'easy',
	'diff:medium': 'medium',
	'diff:hard': 'hard'
}

// Prefix for a points label, e.g., "points:8"
export const POINTS_PREFIX = 'points:'

// Optional project mapping; default fallback will be used if no match.
export const LABEL_PROJECT_MAP: Record<string, string> = {
	'project:ab-sim': 'ab-sim',
	'project:basketball': 'basketball'
}
