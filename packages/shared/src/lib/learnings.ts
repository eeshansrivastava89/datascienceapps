import yaml from 'js-yaml'

// Types
export type LearningType = 'blog' | 'substack' | 'doc' | 'video'
export type ProjectSlug = 'ab-sim' | 'basketball' | 'build-log' | 'general'

export interface Learning {
  title: string
  url: string
  type: LearningType
  project: ProjectSlug
  tags: string[]
  date: string
  excerpt?: string
  featured?: boolean
}

// Type badges configuration
export const TYPE_CONFIG: Record<LearningType, { label: string; emoji: string; color: string }> = {
  blog: {
    label: 'Blog',
    emoji: '📝',
    color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
  },
  substack: {
    label: 'Substack',
    emoji: '📰',
    color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
  },
  doc: {
    label: 'Doc',
    emoji: '📄',
    color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
  },
  video: {
    label: 'Video',
    emoji: '🎥',
    color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
  }
}

// Project display names
export const PROJECT_NAMES: Record<ProjectSlug, string> = {
  'ab-sim': 'A/B Simulator',
  'basketball': 'Basketball Analyzer',
  'build-log': 'Build Log',
  'general': 'General'
}

// Parse YAML string into Learning array (use with Vite raw import)
export function parseLearningsYaml(yamlContent: string): Learning[] {
  try {
    const data = yaml.load(yamlContent) as Learning[]
    return data || []
  } catch (e) {
    console.warn('Could not parse learnings YAML:', e)
    return []
  }
}

// Get all learnings sorted by date (newest first), featured items pinned
export function getLearnings(items: Learning[]): Learning[] {
  const featured = items.filter(l => l.featured).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const regular = items.filter(l => !l.featured).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return [...featured, ...regular]
}

// Filter learnings by project
export function getLearningsByProject(items: Learning[], project: ProjectSlug): Learning[] {
  return getLearnings(items.filter(l => l.project === project))
}

// Get unique projects from learnings (for filter pills)
export function getProjects(items: Learning[]): ProjectSlug[] {
  const projects = new Set(items.map(l => l.project))
  return Array.from(projects).sort()
}

// Paginate learnings
export function paginateLearnings(
  items: Learning[], 
  page: number, 
  pageSize: number = 10
): { items: Learning[]; totalPages: number; currentPage: number } {
  const startIndex = (page - 1) * pageSize
  const paginatedItems = items.slice(startIndex, startIndex + pageSize)
  const totalPages = Math.ceil(items.length / pageSize)
  
  return {
    items: paginatedItems,
    totalPages,
    currentPage: page
  }
}

// Check if URL is external
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

// Format date for display
export function formatLearningDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}
