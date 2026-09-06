import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface PingWaveProps {
	currentPing: number
	history?: number[]
	visible?: boolean
}

const WAVE_BARS = 20

export function PingWave({
	currentPing,
	history = [],
	visible = true,
}: PingWaveProps) {
	const [bars, setBars] = useState<number[]>(new Array(WAVE_BARS).fill(0))
	const animationRef = useRef<number | null>(null)

	useEffect(() => {
		if (!visible) return

		setBars((prev) => {
			const next = [...prev.slice(1), currentPing]
			return next
		})

		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current)
		}
	}, [currentPing, visible])

	const maxPing = Math.max(...bars, 1)

	const getPingColor = (ms: number) => {
		if (ms < 30) return '#51FFB5'
		if (ms < 60) return '#FEED8B'
		if (ms < 100) return '#f97316'
		return '#f94d40'
	}

	const getPingLabel = (ms: number) => {
		if (ms < 30) return 'Excellent'
		if (ms < 60) return 'Good'
		if (ms < 100) return 'Fair'
		return 'Poor'
	}

	if (!visible) return null

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			className={cn(
				'rounded-xl p-3 bg-mnx-surface/80 border border-mnx-border',
				'backdrop-blur-sm'
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-[11px] font-medium text-mnx-text-muted font-inter">
					Ping Monitor
				</span>
				<div className="flex items-center gap-2">
					<span
						className="text-sm font-mono font-bold"
						style={{ color: getPingColor(currentPing) }}
					>
						{currentPing}ms
					</span>
					<span
						className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
						style={{
							color: getPingColor(currentPing),
							backgroundColor: `${getPingColor(currentPing)}15`,
						}}
					>
						{getPingLabel(currentPing)}
					</span>
				</div>
			</div>

			<div className="flex items-end gap-[2px] h-10">
				{bars.map((ping, i) => {
					const height = maxPing > 0 ? (ping / maxPing) * 100 : 0
					const color = getPingColor(ping)

					return (
						<motion.div
							key={i}
							initial={{ height: 0 }}
							animate={{ height: `${Math.max(height, 4)}%` }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
							className="flex-1 rounded-sm"
							style={{
								backgroundColor: color,
								opacity: 0.3 + (i / WAVE_BARS) * 0.7,
							}}
						/>
					)
				})}
			</div>

			<div className="flex items-center justify-between mt-1.5">
				<span className="text-[9px] text-mnx-text-dim font-mono">
					-{WAVE_BARS}s
				</span>
				<span className="text-[9px] text-mnx-text-dim font-mono">now</span>
			</div>
		</motion.div>
	)
}

export interface JitterDisplayProps {
	currentPing: number
	previousPing: number
}

export function JitterDisplay({
	currentPing,
	previousPing,
}: JitterDisplayProps) {
	const jitter = Math.abs(currentPing - previousPing)
	const isStable = jitter < 10

	return (
		<div className="flex items-center gap-1.5">
			<div
				className={cn(
					'w-1.5 h-1.5 rounded-full',
					isStable ? 'bg-mnx-neon' : 'bg-mnx-warning'
				)}
			/>
			<span className="text-[10px] font-mono text-mnx-text-muted">
				Jitter: {jitter}ms
			</span>
		</div>
	)
}
