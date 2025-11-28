import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import { Search, X } from 'lucide-react'
import type { Task } from '@/lib/build-log-types'

interface SearchBarProps {
	tasks: Task[]
	onFilteredTasks: (tasks: Task[]) => void
}

export default function SearchBar({ tasks, onFilteredTasks }: SearchBarProps) {
	const [query, setQuery] = useState('')

	const fuse = new Fuse(tasks, {
		keys: ['title', 'category', 'status', 'projectSlug', 'labels'],
		threshold: 0.3,
		includeScore: true
	})

	useEffect(() => {
		if (query.trim() === '') {
			onFilteredTasks(tasks)
		} else {
			const results = fuse.search(query)
			onFilteredTasks(results.map((r) => r.item))
		}
	}, [query, tasks])

	return (
		<div className='relative'>
			<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
			<input
				type='text'
				placeholder='Search tasks by title, category, status...'
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className='w-full border border-border bg-primary-foreground py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20'
			/>
			{query && (
				<button onClick={() => setQuery('')} className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground' aria-label='Clear search'>
					<X className='h-4 w-4' />
				</button>
			)}
		</div>
	)
}
