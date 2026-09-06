import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface OptimizeButtonProps {
	onClick: () => void
	state: 'idle' | 'connecting' | 'connected' | 'error'
	disabled?: boolean
}

export function OptimizeButton({
	onClick,
	state,
	disabled = false,
}: OptimizeButtonProps) {
	const [ripples, setRipples] = useState<number[]>([])

	const triggerRipple = () => {
		const id = Date.now()
		setRipples((prev) => [...prev, id])
		setTimeout(() => {
			setRipples((prev) => prev.filter((r) => r !== id))
		}, 1000)
	}

	const getButtonStyle = () => {
		switch (state) {
			case 'connecting':
				return 'bg-mnx-primary animate-glowPulse'
			case 'connected':
				return 'bg-mnx-neon text-mnx-obsidian'
			case 'error':
				return 'bg-mnx-danger'
			default:
				return 'bg-gradient-to-r from-mnx-primary to-mnx-primary-light hover:from-mnx-primary-light hover:to-mnx-primary'
		}
	}

	const getLabel = () => {
		switch (state) {
			case 'connecting':
				return 'OPTIMIZING...'
			case 'connected':
				return 'OPTIMIZED & ENGAGED'
			case 'error':
				return 'CONNECTION FAILED'
			default:
				return 'OPTIMIZE & ENGAGE'
		}
	}

	return (
		<div className="relative">
			{ripples.map((id) => (
				<motion.div
					key={id}
					initial={{ scale: 0.5, opacity: 0.6 }}
					animate={{ scale: 2.5, opacity: 0 }}
					transition={{ duration: 1, ease: 'easeOut' }}
					className="absolute inset-0 rounded-xl border-2 border-mnx-primary pointer-events-none"
					style={{ zIndex: -1 }}
				/>
			))}

			<motion.button
				onClick={() => {
					if (state === 'idle' || state === 'error') {
						triggerRipple()
						onClick()
					}
				}}
				disabled={disabled || state === 'connecting'}
				whileHover={state === 'idle' ? { scale: 1.02 } : {}}
				whileTap={state === 'idle' ? { scale: 0.98 } : {}}
				className={cn(
					'relative w-full px-6 py-3 rounded-xl font-inter font-bold text-sm tracking-wider',
					'transition-all duration-300 overflow-hidden cursor-pointer',
					'disabled:opacity-60 disabled:cursor-not-allowed',
					getButtonStyle(),
					state === 'connecting' && 'text-white'
				)}
			>
				{state === 'connecting' && (
					<motion.div
						className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
						animate={{ x: ['-100%', '100%'] }}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: 'linear',
						}}
					/>
				)}

				{state === 'connected' && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: [0, 1.2, 1] }}
						transition={{ duration: 0.5 }}
						className="absolute inset-0 bg-mnx-neon/20 rounded-xl"
					/>
				)}

				<span className="relative z-10 flex items-center justify-center gap-2">
					{state === 'connecting' && (
						<motion.span
							animate={{ rotate: 360 }}
							transition={{
								duration: 1,
								repeat: Infinity,
								ease: 'linear',
							}}
							className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
						/>
					)}
					{state === 'connected' && (
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2.5}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					)}
					{getLabel()}
				</span>
			</motion.button>
		</div>
	)
}
