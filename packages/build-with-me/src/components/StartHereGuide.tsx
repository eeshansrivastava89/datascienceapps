import { useState } from 'react'
import { Sparkles, GitFork, GitPullRequest, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const STEPS = [
	{
		icon: Sparkles,
		title: '1. Pick a task',
		description: 'Browse open tasks below. Look for "Good First Issue" if you\'re new.',
		color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20',
	},
	{
		icon: GitFork,
		title: '2. Claim it',
		description: 'Comment "I\'ll take this" on the GitHub issue to reserve it.',
		color: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/20',
	},
	{
		icon: GitPullRequest,
		title: '3. Ship a PR',
		description: 'Fork, code, and open a pull request. I\'ll review within 48 hours.',
		color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20',
	},
	{
		icon: CheckCircle,
		title: '4. Get merged',
		description: 'Your work ships to production and shows on your GitHub profile.',
		color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20',
	},
]

export default function StartHereGuide() {
	const [isExpanded, setIsExpanded] = useState(false)

	return (
		<div className='rounded-2xl border border-purple-200 dark:border-purple-400/40 bg-gradient-to-r from-purple-50 to-orange-50 dark:from-purple-900/50 dark:to-orange-900/40 shadow-lg shadow-purple-500/5'>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className='flex w-full items-center justify-between px-4 py-3'
			>
				<div className='flex items-center gap-2'>
					<Sparkles className='h-4 w-4 text-purple-600 dark:text-purple-400' />
					<span className='text-sm font-semibold text-foreground'>New here? Here's how it works</span>
				</div>
				{isExpanded ? (
					<ChevronUp className='h-4 w-4 text-muted-foreground' />
				) : (
					<ChevronDown className='h-4 w-4 text-muted-foreground' />
				)}
			</button>

			{isExpanded && (
				<div className='border-t border-purple-200/50 dark:border-purple-500/20 px-4 pb-4 pt-3'>
					<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
						{STEPS.map(({ icon: Icon, title, description, color }) => (
							<div key={title} className='flex items-start gap-3'>
								<div className={`shrink-0 rounded-lg p-2 ${color}`}>
									<Icon className='h-4 w-4' />
								</div>
								<div className='min-w-0'>
									<div className='text-sm font-semibold text-foreground'>{title}</div>
									<div className='text-xs text-muted-foreground'>{description}</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
