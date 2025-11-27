import yaml from 'js-yaml'

// Types
export type ProjectStatus = 'live' | 'in-progress' | 'coming-soon'

export interface ProjectTag {
  name: string
  color: 'orange' | 'sky' | 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber' | 'indigo'
}

export interface Project {
  id: string
  name: string
  url: string
  status: ProjectStatus
  description: string
  shortDescription: string
  tags: ProjectTag[]
}

// Status badge configuration
export const STATUS_CONFIG: Record<ProjectStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  live: {
    label: 'Live',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-300'
  },
  'in-progress': {
    label: 'In Progress',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
    textColor: 'text-amber-700 dark:text-amber-300'
  },
  'coming-soon': {
    label: 'Coming Soon',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-500/20',
    textColor: 'text-gray-600 dark:text-gray-400'
  }
}

// Tag color configuration
export const TAG_COLORS: Record<ProjectTag['color'], string> = {
  orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
  sky: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  cyan: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  violet: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300',
  amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
}

// Parse YAML string into Project array (use with Vite raw import)
export function parseProjectsYaml(yamlContent: string): Project[] {
  try {
    const data = yaml.load(yamlContent) as { projects: Project[] }
    return data?.projects || []
  } catch (e) {
    console.warn('Could not parse projects YAML:', e)
    return []
  }
}

// Get all projects
export function getProjects(items: Project[]): Project[] {
  return items
}

// Filter by status
export function getProjectsByStatus(items: Project[], status: ProjectStatus): Project[] {
  return items.filter(p => p.status === status)
}

// Get live projects only
export function getLiveProjects(items: Project[]): Project[] {
  return getProjectsByStatus(items, 'live')
}
