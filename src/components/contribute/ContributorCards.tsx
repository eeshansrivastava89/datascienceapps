import { Users, ExternalLink } from 'lucide-react'
import type { Contributor, Task } from '@/lib/build-log-types'

interface ContributorCardsProps {
	contributors: Contributor[]
	tasks: Task[]
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ProgressBar({ merged, total }: { merged: number; total: number }) {
	const percentage = total > 0 ? Math.round((merged / total) * 100) : 0
	return (
		<div className='space-y-1'>
			<div className='flex items-center justify-between text-xs'>
				<span className='text-muted-foreground'>Completion</span>
				<span className='font-medium text-foreground'>{percentage}%</span>
			</div>
			<div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
				<div className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700' style={{ width: `${percentage}%` }} />
			</div>
		</div>
	)
}

export default function ContributorCards({ contributors, tasks }: ContributorCardsProps) {
	const totalIssues = tasks.length
	const latestShipByUser = new Map<string, Task>()
	tasks
		.filter((t) => t.status === 'merged' && t.closedAt)
		.sort((a, b) => new Date(b.closedAt!).getTime() - new Date(a.closedAt!).getTime())
		.forEach((task) => {
			const user = task.closedBy?.name || task.assignees?.[0]?.name
			if (user && !latestShipByUser.has(user)) latestShipByUser.set(user, task)
		})

	if (contributors.length === 0) {
		return (
			<div className='border border-border bg-primary-foreground p-8 text-center'>
				<Users className='mx-auto h-8 w-8 text-muted-foreground' />
				<p className='mt-2 text-sm text-muted-foreground'>No contributors yet. Be the first to ship!</p>
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center gap-2'>
				<Users className='h-5 w-5 text-foreground' />
				<h2 className='text-xl font-semibold text-foreground'>Contributors</h2>
				<span className='text-sm text-muted-foreground'>({contributors.length})</span>
			</div>
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{contributors.map((contributor) => {
					const latestShip = latestShipByUser.get(contributor.name)
					return (
						<div key={contributor.name} className='group border border-border bg-primary-foreground p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg'>
							<div className='flex items-start gap-4'>
								{contributor.avatarUrl ? (
									<img src={contributor.avatarUrl} alt={contributor.name} className='h-14 w-14 rounded-full border-2 border-border shadow-sm' />
								) : (
									<div className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-bold text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300'>
										{contributor.name.charAt(0).toUpperCase()}
									</div>
								)}
								<div className='min-w-0 flex-1'>
									<span className='truncate text-base font-semibold text-foreground'>{contributor.name}</span>
									<div className='mt-0.5 text-sm text-muted-foreground'>
										{contributor.mergedPRs} PRs merged{contributor.reviews > 0 && ` • ${contributor.reviews} reviews`}
									</div>
								</div>
							</div>
							<div className='mt-4'>
								<ProgressBar merged={contributor.mergedPRs} total={totalIssues} />
							</div>
							{latestShip && (
								<div className='mt-4 border-t border-border pt-3'>
									<div className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>Latest ship</div>
									<a href={latestShip.githubUrl} target='_blank' rel='noreferrer' className='mt-1 block text-sm text-foreground transition hover:text-muted-foreground'>
										<span className='line-clamp-2'><span className='text-muted-foreground'>#{latestShip.id}</span> {latestShip.title}</span>
									</a>
									<div className='mt-1 flex items-center justify-between'>
										<span className='text-xs text-muted-foreground'>{latestShip.closedAt && formatDate(latestShip.closedAt)}</span>
										<a href={latestShip.githubUrl} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1 text-xs text-foreground hover:text-muted-foreground'>
											<ExternalLink className='h-3 w-3' />
											View
										</a>
									</div>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
