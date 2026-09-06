import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface GameProfile {
	id: string
	name: string
	executables: string[]
	regions: { id: string; name: string; countryCode: string; pingMs: number }[]
	dnsOnly: boolean
}

interface GameHubProps {
	games: GameProfile[]
	activeGames: Map<string, { enabled: boolean; mode: 'dns_only' | 'full_boost'; region?: string }>
	onToggle: (gameId: string) => void
	onModeChange: (gameId: string, mode: 'dns_only' | 'full_boost') => void
	onRegionChange: (gameId: string, regionId: string) => void
}

const GAME_ICONS: Record<string, string> = {
	valorant: '\u{1F5E1}\uFE0F',
	cs2: '\u{1F3AF}',
	dota2: '\u{1F9E9}',
	fortnite: '\u{1F4A5}',
	apex: '\u{1F3C6}',
	r6siege: '\u{1F3F0}',
	pubg: '\u{1F3D6}\uFE0F',
	lol: '\u{2694}\uFE0F',
	gtav: '\u{1F697}',
	rust: '\u{1FA93}',
}

const FLAG_EMOJIS: Record<string, string> = {
	DE: '\u{1F1E9}\u{1F1EA}',
	NL: '\u{1F1F3}\u{1F1F1}',
	GB: '\u{1F1EC}\u{1F1E7}',
	US: '\u{1F1FA}\u{1F1F8}',
	JP: '\u{1F1EF}\u{1F1F5}',
	SG: '\u{1F1F8}\u{1F1EC}',
	KR: '\u{1F1F0}\u{1F1F7}',
	BH: '\u{1F1E7}\u{1F1ED}',
	TR: '\u{1F1F9}\u{1F1F7}',
	RU: '\u{1F1F7}\u{1F1FA}',
}

export function GameHub({
	games,
	activeGames,
	onToggle,
	onModeChange,
	onRegionChange,
}: GameHubProps) {
	const [expandedGame, setExpandedGame] = useState<string | null>(null)

	const toggleExpand = useCallback(
		(gameId: string) => {
			setExpandedGame((prev) => (prev === gameId ? null : gameId))
		},
		[]
	)

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 px-1">
				<span className="text-lg">\u{1F3AE}</span>
				<h2 className="text-sm font-bold font-inter text-mnx-text tracking-wide uppercase">
					Game FastPath
				</h2>
				<span className="ml-auto text-[10px] font-mono text-mnx-text-dim">
					{Array.from(activeGames.values()).filter((g) => g.enabled).length}/{games.length} active
				</span>
			</div>

			<div className="grid grid-cols-2 gap-2">
				{games.map((game) => {
					const state = activeGames.get(game.id)
					const isActive = state?.enabled ?? false
					const mode = state?.mode ?? 'dns_only'
					const region = state?.region ?? game.regions[0]?.id
					const isExpanded = expandedGame === game.id

					return (
						<motion.div
							key={game.id}
							layout
							className={cn(
								'relative rounded-xl border p-3 transition-all duration-300',
								isActive
									? 'bg-mnx-primary/10 border-mnx-primary/40 shadow-[0_0_12px_rgba(12,140,233,0.15)]'
									: 'bg-mnx-surface border-mnx-border hover:border-mnx-primary/20'
							)}
						>
							<div className="flex items-center gap-2.5">
								<div
									className={cn(
										'w-9 h-9 rounded-lg flex items-center justify-center text-lg',
										'bg-mnx-elevated border border-mnx-border',
										isActive && 'border-mnx-primary/30'
									)}
								>
									{GAME_ICONS[game.id] || '\u{1F3AE}'}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-1.5">
										<span className="text-xs font-bold font-inter text-mnx-text truncate">
											{game.name}
										</span>
										{isActive && (
											<span className="w-1.5 h-1.5 rounded-full bg-mnx-neon animate-pulse" />
										)}
									</div>
									<div className="flex items-center gap-1 mt-0.5">
										<span
											className={cn(
												'text-[9px] font-mono px-1 py-0.5 rounded',
												mode === 'full_boost'
													? 'bg-mnx-neon/15 text-mnx-neon'
													: 'bg-mnx-text-dim/15 text-mnx-text-dim'
											)}
										>
											{mode === 'full_boost' ? 'FULL BOOST' : 'DNS ONLY'}
										</span>
										{region && (
											<span className="text-[9px] font-mono text-mnx-text-dim">
												{FLAG_EMOJIS[game.regions.find((r) => r.id === region)?.countryCode || '']}{' '}
												{game.regions.find((r) => r.id === region)?.name}
											</span>
										)}
									</div>
								</div>

								<div className="flex items-center gap-1.5">
									<button
										onClick={(e) => {
											e.stopPropagation()
											toggleExpand(game.id)
										}}
										className="p-1 rounded-md text-mnx-text-dim hover:text-mnx-text hover:bg-mnx-elevated transition-colors"
									>
										<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
									</button>

									<button
										onClick={(e) => {
											e.stopPropagation()
											onToggle(game.id)
										}}
										className={cn(
											'w-10 h-5 rounded-full transition-all duration-300 relative cursor-pointer',
											isActive
												? 'bg-mnx-primary shadow-[0_0_8px_rgba(12,140,233,0.4)]'
												: 'bg-mnx-border'
										)}
									>
										<motion.div
											className={cn(
												'w-4 h-4 rounded-full absolute top-0.5',
												isActive ? 'bg-white' : 'bg-mnx-text-dim'
											)}
											animate={{ left: isActive ? 22 : 2 }}
											transition={{ type: 'spring', stiffness: 500, damping: 30 }}
										/>
									</button>
								</div>
							</div>

							<AnimatePresence>
								{isExpanded && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: 'auto', opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="overflow-hidden"
									>
										<div className="pt-3 mt-3 border-t border-mnx-border/50 space-y-2.5">
											<div className="flex items-center gap-2">
												<span className="text-[10px] font-medium text-mnx-text-muted">Mode:</span>
												<div className="flex gap-1">
													<button
														onClick={() => onModeChange(game.id, 'dns_only')}
														className={cn(
															'px-2 py-0.5 text-[10px] font-mono rounded-md transition-all',
															mode === 'dns_only'
																? 'bg-mnx-primary text-white'
																: 'bg-mnx-elevated text-mnx-text-dim hover:text-mnx-text'
														)}
													>
														DNS Only
													</button>
													<button
														onClick={() => onModeChange(game.id, 'full_boost')}
														className={cn(
															'px-2 py-0.5 text-[10px] font-mono rounded-md transition-all',
															mode === 'full_boost'
																? 'bg-mnx-neon text-mnx-obsidian'
																: 'bg-mnx-elevated text-mnx-text-dim hover:text-mnx-text'
														)}
													>
														Full Boost
													</button>
												</div>
											</div>

											<div>
												<span className="text-[10px] font-medium text-mnx-text-muted block mb-1">Region:</span>
												<div className="flex flex-wrap gap-1">
													{game.regions.map((r) => (
														<button
															key={r.id}
															onClick={() => onRegionChange(game.id, r.id)}
															className={cn(
																'flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-md transition-all',
																region === r.id
																	? 'bg-mnx-primary/20 text-mnx-primary border border-mnx-primary/30'
																	: 'bg-mnx-elevated text-mnx-text-dim hover:text-mnx-text border border-transparent'
															)}
														>
															<span>{FLAG_EMOJIS[r.countryCode] || ''}</span>
															<span>{r.name}</span>
															{r.pingMs > 0 && (
																<span className={cn(
																	'font-bold',
																	r.pingMs < 30 ? 'text-mnx-neon' : r.pingMs < 60 ? 'text-mnx-warning' : 'text-mnx-danger'
																)}>
																	{r.pingMs}ms
																</span>
															)}
														</button>
													))}
												</div>
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					)
				})}
			</div>
		</div>
	)
}
