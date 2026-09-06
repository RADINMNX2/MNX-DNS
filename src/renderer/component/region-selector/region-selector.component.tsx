import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface Region {
	code: string
	name: string
	flag: string
	ping?: number
}

interface RegionSelectorProps {
	regions: Region[]
	selected: Region | null
	onSelect: (region: Region) => void
}

export function RegionSelector({
	regions,
	selected,
	onSelect,
}: RegionSelectorProps) {
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const handleClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [open])

	const getPingBadge = (ping?: number) => {
		if (ping === undefined) return null
		const color =
			ping < 30
				? 'bg-mnx-neon/20 text-mnx-neon'
				: ping < 60
					? 'bg-mnx-warning/20 text-mnx-warning'
					: 'bg-mnx-danger/20 text-mnx-danger'

		return (
			<span
				className={cn(
					'text-[9px] font-mono px-1 py-0.5 rounded-md',
					color
				)}
			>
				{ping}ms
			</span>
		)
	}

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen(!open)}
				className={cn(
					'flex items-center gap-2 px-3 py-2 rounded-xl',
					'bg-mnx-surface border border-mnx-border',
					'hover:border-mnx-primary/40 transition-all duration-200',
					'text-sm font-inter text-mnx-text',
					open && 'border-mnx-primary/60'
				)}
			>
				{selected ? (
					<>
						<span className="text-lg">{selected.flag}</span>
						<span className="font-medium">{selected.name}</span>
						{getPingBadge(selected.ping)}
					</>
				) : (
					<span className="text-mnx-text-muted">Select Region</span>
				)}
				<svg
					className={cn(
						'w-4 h-4 text-mnx-text-dim transition-transform',
						open && 'rotate-180'
					)}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -5, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -5, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className={cn(
							'absolute z-50 w-full mt-1 rounded-xl overflow-hidden',
							'bg-mnx-surface border border-mnx-border shadow-xl',
							'max-h-60 overflow-y-auto'
						)}
					>
						{regions.map((region) => (
							<button
								key={region.code}
								onClick={() => {
									onSelect(region)
									setOpen(false)
								}}
								className={cn(
									'flex items-center gap-2.5 w-full px-3 py-2',
									'text-left text-sm font-inter',
									'hover:bg-mnx-elevated transition-colors',
									selected?.code === region.code &&
										'bg-mnx-primary/10 text-mnx-primary'
								)}
							>
								<span className="text-lg">{region.flag}</span>
								<span className="flex-1 font-medium text-mnx-text">
									{region.name}
								</span>
								{getPingBadge(region.ping)}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export const DEFAULT_REGIONS: Region[] = [
	{ code: 'eu', name: 'Europe', flag: '\u{1F1EA}\u{1F1FA}' },
	{ code: 'us', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
	{ code: 'de', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
	{ code: 'nl', name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}' },
	{ code: 'uk', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
	{ code: 'fr', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
	{ code: 'jp', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
	{ code: 'sg', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
	{ code: 'au', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
	{ code: 'br', name: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}' },
	{ code: 'ca', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
	{ code: 'kr', name: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}' },
	{ code: 'in', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
	{ code: 'tr', name: 'Turkey', flag: '\u{1F1F9}\u{1F1F7}' },
]
