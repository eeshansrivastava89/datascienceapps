import { useState } from 'react'
import { X, Play } from 'lucide-react'

interface VideoModalProps {
	thumbnailUrl?: string
	videoUrl?: string
}

const PLACEHOLDER_VIDEO = 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4'
const PLACEHOLDER_THUMBNAIL = 'https://images.pexels.com/videos/3571264/free-video-3571264.jpg?auto=compress&cs=tinysrgb&w=800'

export default function VideoModal({ thumbnailUrl = PLACEHOLDER_THUMBNAIL, videoUrl = PLACEHOLDER_VIDEO }: VideoModalProps) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<button onClick={() => setIsOpen(true)} className='group relative aspect-video w-full overflow-hidden bg-black shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50'>
				<img src={thumbnailUrl} alt='Watch how The Build Log works' className='h-full w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100' />
				<div className='absolute inset-0 flex items-center justify-center'>
					<div className='flex h-16 w-16 items-center justify-center rounded-full bg-foreground shadow-lg shadow-black/30 transition group-hover:scale-110'>
						<Play className='h-7 w-7 text-background' fill='currentColor' />
					</div>
				</div>
				<div className='absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm'>Watch: How it works (2 min)</div>
			</button>
			{isOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm' onClick={() => setIsOpen(false)}>
					<div className='relative w-full max-w-4xl' onClick={(e) => e.stopPropagation()}>
						<button onClick={() => setIsOpen(false)} className='absolute -right-2 -top-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20'>
							<X className='h-5 w-5' />
						</button>
						<div className='aspect-video overflow-hidden bg-black shadow-2xl'>
							<video src={videoUrl} controls autoPlay className='h-full w-full'>Your browser does not support the video tag.</video>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
