import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface GameCardProps {
	id: string
	name: string
	icon?: string
	ping?: number
	selected?: boolean
	onClick?: (id: string) => void
}

export function GameCard({
	id,
	name,
	icon,
	ping = -1,
	selected = false,
	onClick,
}: GameCardProps) {
	const [hovered, setHovered] = useState(false)

	const getPColor = (ms: number) => {
		if (ms < 30) return 'text-mnx-neon'
		if (ms < 60) return 'text-yellow-400'
		if (ms < 100) return 'text-orange-400'
		return 'text-mnx-danger'
	}

	return (
		<motion.button
			onClick={() => onClick?.(id)}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			whileHover={{ scale: 1.04 }}
			whileTap={{ scale: 0.97 }}
			className={cn(
				'relative game-card rounded-xl p-3 cursor-pointer transition-all duration-300',
				'flex flex-col items-center gap-2 min-w-[90px]',
				selected && 'active border-mnx-neon shadow-[0_0_15px_rgba(81,255,181,0.2)]'
			)}
		>
			{selected && (
				<div className="absolute inset-0 rounded-xl border-2 border-mnx-neon/50 animate-neonBorder pointer-events-none" />
			)}

			<div
				className={cn(
					'w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center',
					'bg-mnx-elevated border border-mnx-border',
					'transition-all duration-300',
					selected && 'border-mnx-primary/50 shadow-[0_0_10px_rgba(12,140,233,0.3)]'
				)}
			>
				{icon ? (
					<img
						src={icon}
						alt={name}
						className="w-full h-full object-contain"
						onError={(e) => {
							e.currentTarget.style.display = 'none'
						}}
					/>
				) : (
					<span className="text-lg font-bold text-mnx-text/60 font-vazir">
						{name.charAt(0).toUpperCase()}
					</span>
				)}
			</div>

			<span className="text-[11px] font-medium text-mnx-text/80 font-inter truncate max-w-full">
				{name}
			</span>

			{ping >= 0 && (
				<span
					className={cn(
						'text-[10px] font-mono font-medium',
						getPColor(ping)
					)}
				>
					{ping}ms
				</span>
			)}

			{hovered && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="absolute inset-0 rounded-xl bg-mnx-primary/5 pointer-events-none"
				/>
			)}
		</motion.button>
	)
}

export interface GameGridProps {
	games: Array<{ id: string; name: string; icon?: string; ping?: number }>
	selectedIds: string[]
	onToggle: (id: string) => void
	columns?: number
}

export function GameGrid({
	games,
	selectedIds,
	onToggle,
	columns = 5,
}: GameGridProps) {
	return (
		<div
			className="grid gap-2"
			style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
		>
			{games.map((game) => (
				<GameCard
					key={game.id}
					id={game.id}
					name={game.name}
					icon={game.icon}
					ping={game.ping}
					selected={selectedIds.includes(game.id)}
					onClick={onToggle}
				/>
			))}
		</div>
	)
}
