import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import type { Category, Status } from '@/lib/build-log-types'
import { CATEGORY_STYLES, STATUS_STYLES } from '@/lib/build-log-config'

interface FilterPanelProps {
	selectedCategories: Category[]
	selectedStatuses: Status[]
	onCategoryChange: (categories: Category[]) => void
	onStatusChange: (statuses: Status[]) => void
}

const CATEGORIES: Category[] = ['frontend', 'backend', 'analytics', 'wiring', 'docs']
const STATUSES: Status[] = ['open', 'claimed', 'in-review', 'merged']

export default function FilterPanel({ selectedCategories, selectedStatuses, onCategoryChange, onStatusChange }: FilterPanelProps) {
	const [isOpen, setIsOpen] = useState(false)

	const toggleCategory = (cat: Category) => {
		if (selectedCategories.includes(cat)) {
			onCategoryChange(selectedCategories.filter((c) => c !== cat))
		} else {
			onCategoryChange([...selectedCategories, cat])
		}
	}

	const toggleStatus = (status: Status) => {
		if (selectedStatuses.includes(status)) {
			onStatusChange(selectedStatuses.filter((s) => s !== status))
		} else {
			onStatusChange([...selectedStatuses, status])
		}
	}

	const clearAll = () => {
		onCategoryChange([])
		onStatusChange([])
	}

	const activeFiltersCount = selectedCategories.length + selectedStatuses.length

	return (
		<div className='relative'>
			<button onClick={() => setIsOpen(!isOpen)} className='flex items-center gap-2 border border-border bg-primary-foreground px-4 py-2 text-sm font-medium text-foreground transition hover:border-foreground/50 hover:bg-muted focus:outline-none'>
				<Filter className='h-4 w-4' />
				Filters
				{activeFiltersCount > 0 && <span className='rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background'>{activeFiltersCount}</span>}
			</button>
			{isOpen && (
				<div className='absolute right-0 z-10 mt-2 w-80 border border-border bg-primary-foreground p-4 shadow-lg'>
					<div className='mb-4 flex items-center justify-between'>
						<h3 className='text-sm font-semibold text-foreground'>Filter Tasks</h3>
						<div className='flex items-center gap-2'>
							{activeFiltersCount > 0 && <button onClick={clearAll} className='text-xs text-muted-foreground hover:text-foreground'>Clear all</button>}
							<button onClick={() => setIsOpen(false)} className='text-muted-foreground hover:text-foreground' aria-label='Close filters'><X className='h-4 w-4' /></button>
						</div>
					</div>
					<div className='space-y-4'>
						<div>
							<h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Category</h4>
							<div className='flex flex-wrap gap-2'>
								{CATEGORIES.map((cat) => {
									const isSelected = selectedCategories.includes(cat)
									return (
										<button key={cat} onClick={() => toggleCategory(cat)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isSelected ? CATEGORY_STYLES[cat] : 'border border-border bg-muted text-muted-foreground hover:border-foreground/50'}`}>
											{cat}
										</button>
									)
								})}
							</div>
						</div>
						<div>
							<h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Status</h4>
							<div className='flex flex-wrap gap-2'>
								{STATUSES.map((status) => {
									const isSelected = selectedStatuses.includes(status)
									return (
										<button key={status} onClick={() => toggleStatus(status)} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${isSelected ? STATUS_STYLES[status] : 'border border-border bg-muted text-muted-foreground hover:border-foreground/50'}`}>
											{status}
										</button>
									)
								})}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
