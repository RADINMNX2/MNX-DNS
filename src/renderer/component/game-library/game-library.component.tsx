import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import {
	MdRefresh,
	MdRadar,
	MdSportsEsports,
	MdCheckCircle,
	MdAutorenew,
	MdLocationOn,
	MdSpeed,
	MdSearch,
} from 'react-icons/md'
import {
	TbServer,
	TbDeviceDesktopGamepad,
	TbPlayerPlay,
	TbPlayerStop,
} from 'react-icons/tb'

interface InstalledGame {
	id: string
	name: string
	launcher: string
	executable: string
	installDir: string
	detectedAt: number
	isRunning: boolean
	autoOptimize: boolean
	preferredMode: 'dns_only' | 'full_boost'
	preferredRegion: string
}

interface RadarSnapshot {
	running: boolean
	engaged: Array<{ gameId: string; engagedAt: number }>
	watched: string[]
}

interface MyLibraryProps {
	games: InstalledGame[]
	radar: RadarSnapshot | null
	scanning: boolean
	scanDuration: number | null
	onScan: () => void
	onAutoOptimizeToggle: (gameId: string) => void
	onModeChange: (gameId: string, mode: 'dns_only' | 'full_boost') => void
	onRegionChange: (gameId: string, region: string) => void
	onRadarToggle: (enabled: boolean) => void
}

const REGION_OPTIONS = [
	{ id: 'eu', label: 'Frankfurt', flag: '\u{1F1E9}\u{1F1EA}' },
	{ id: 'eu2', label: 'Amsterdam', flag: '\u{1F1F3}\u{1F1F1}' },
	{ id: 'uk', label: 'London', flag: '\u{1F1EC}\u{1F1E7}' },
	{ id: 'us', label: 'Chicago', flag: '\u{1F1FA}\u{1F1F8}' },
	{ id: 'us2', label: 'Virginia', flag: '\u{1F1FA}\u{1F1F8}' },
	{ id: 'asia', label: 'Tokyo', flag: '\u{1F1EF}\u{1F1F5}' },
	{ id: 'me', label: 'Bahrain', flag: '\u{1F1E7}\u{1F1ED}' },
	{ id: 'tr', label: 'Istanbul', flag: '\u{1F1F9}\u{1F1F7}' },
	{ id: 'sea', label: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
]

const LAUNCHER_COLORS: Record<string, string> = {
	steam: 'bg-[#1b2838]',
	epic: 'bg-[#2a2a2a]',
	riot: 'bg-[#ff4655]',
	'battle.net': 'bg-[#00aeef]',
	ea: 'bg-[#f68b1e]',
	ubisoft: 'bg-[#0062cc]',
	gog: 'bg-[#86328a]',
	xbox: 'bg-[#107c10]',
	unknown: 'bg-[#374151]',
}

const LAUNCHER_BADGES: Record<string, string> = {
	steam: 'STEAM',
	epic: 'EPIC',
	riot: 'RIOT',
	'battle.net': 'BNET',
	ea: 'EA',
	ubisoft: 'UBI',
	gog: 'GOG',
	xbox: 'XBOX',
	unknown: 'LOCAL',
}

const GAME_THUMB_MAP: Record<string, number> = {
	valorant: 0,
	cs2: 3,
	dota2: 6,
	fortnite: 9,
	apex: 12,
	r6siege: 15,
	pubg: 18,
	lol: 21,
	gtav: 24,
	rust: 27,
	overwatch2: 30,
	warzone: 33,
	destiny2: 36,
	pathofexile: 39,
	rocketleague: 42,
	genshin: 45,
	lostark: 48,
	naraka: 51,
	thefinals: 54,
	marvelrivals: 57,
}

function getThumbSrc(gameId: string): string {
	const baseIdx = GAME_THUMB_MAP[gameId] ?? 0
	const idx = Math.min(baseIdx, 204)
	return `../../assets/images/image_${String(idx).padStart(4, '0')}.png`
}

function timeAgo(ts: number): string {
	const diff = Date.now() - ts
	if (diff < 60_000) return 'just now'
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
	return `${Math.floor(diff / 86_400_000)}d ago`
}

export function MyLibrary({
	games,
	radar,
	scanning,
	scanDuration,
	onScan,
	onAutoOptimizeToggle,
	onModeChange,
	onRegionChange,
	onRadarToggle,
}: MyLibraryProps) {
	const [expandedGame, setExpandedGame] = useState<string | null>(null)
	const [filter, setFilter] = useState<string>('')

	const isRadarActive = radar?.running ?? false
	const engagedIds = new Set((radar?.engaged ?? []).map((e) => e.gameId))

	const filtered = games.filter((g) =>
		filter ? g.name.toLowerCase().includes(filter.toLowerCase()) : true,
	)

	const runningCount = games.filter((g) => g.isRunning || engagedIds.has(g.id)).length
	const autoCount = games.filter((g) => g.autoOptimize).length

	return (
		<div className="space-y-3">
			{/* Header Bar */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5">
						<TbDeviceDesktopGamepad size={16} className="text-mnx-neon" />
						<h2 className="text-sm font-black font-inter text-mnx-text tracking-tight">
							My Library
						</h2>
					</div>
					{games.length > 0 && (
						<div className="flex gap-1.5">
							<span className="px-1.5 py-0.5 rounded-md bg-mnx-neon/10 text-mnx-neon text-[9px] font-bold font-mono">
								{games.length} FOUND
							</span>
							{runningCount > 0 && (
								<span className="px-1.5 py-0.5 rounded-md bg-mnx-blue/15 text-mnx-blue text-[9px] font-bold font-mono animate-pulse">
									{runningCount} RUNNING
								</span>
							)}
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Radar Toggle */}
					<button
						onClick={() => onRadarToggle(!isRadarActive)}
						className={cn(
							'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all',
							isRadarActive
								? 'bg-mnx-neon/20 text-mnx-neon border border-mnx-neon/30 shadow-[0_0_8px_rgba(81,255,181,0.15)]'
								: 'bg-white/5 text-mnx-text-dim border border-white/5 hover:border-mnx-neon/20',
						)}
					>
						<MdRadar
							size={12}
							className={cn(isRadarActive && 'animate-spin')}
							style={{ animationDuration: '2s' }}
						/>
						{isRadarActive ? 'RADAR ON' : 'RADAR OFF'}
					</button>

					{/* Scan Button */}
					<button
						onClick={onScan}
						disabled={scanning}
						className={cn(
							'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all',
							scanning
								? 'bg-mnx-blue/15 text-mnx-blue border border-mnx-blue/20'
								: 'bg-mnx-blue/10 text-mnx-blue border border-mnx-blue/20 hover:bg-mnx-blue/20',
						)}
					>
						{scanning ? (
							<MdAutorenew size={12} className="animate-spin" />
						) : (
							<MdSearch size={12} />
						)}
						{scanning ? 'SCANNING...' : 'SCAN DRIVES'}
					</button>
				</div>
			</div>

			{/* Scan Result Info */}
			{scanDuration !== null && !scanning && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
				>
					<span className="text-[9px] font-mono text-mnx-text-dim">
						Scan completed in{' '}
						<span className="text-mnx-neon font-bold">{scanDuration}ms</span>
					</span>
					{autoCount > 0 && (
						<span className="text-[9px] font-mono text-mnx-text-dim">
							<span className="text-mnx-blue font-bold">{autoCount}</span> auto-optimizing
						</span>
					)}
				</motion.div>
			)}

			{/* Filter Input */}
			{games.length > 6 && (
				<div className="relative">
					<MdSearch
						size={12}
						className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mnx-text-dim"
					/>
					<input
						type="text"
						placeholder="Search library..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-mnx-text font-inter placeholder:text-mnx-text-dim/50 focus:outline-none focus:border-mnx-blue/30"
					/>
				</div>
			)}

			{/* Empty State */}
			{games.length === 0 && !scanning && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="flex flex-col items-center justify-center py-8 space-y-3"
				>
					<div className="w-12 h-12 rounded-2xl bg-mnx-neon/10 border border-mnx-neon/20 flex items-center justify-center">
						<MdSportsEsports size={20} className="text-mnx-neon/60" />
					</div>
					<div className="text-center">
						<p className="text-xs font-bold text-mnx-text font-inter">
							No games detected yet
						</p>
						<p className="text-[10px] text-mnx-text-dim font-inter mt-0.5">
							Click "Scan Drives" to discover installed games
						</p>
					</div>
				</motion.div>
			)}

			{/* Game Grid */}
			<div className="grid grid-cols-2 gap-2">
				<AnimatePresence mode="popLayout">
					{filtered.map((game, i) => {
						const isEngaged = engagedIds.has(game.id)
						const isExpanded = expandedGame === game.id
						const thumbIdx = GAME_THUMB_MAP[game.id]
						const hasThumb = thumbIdx !== undefined

						return (
							<motion.div
								key={game.id}
								layout
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ delay: i * 0.03 }}
								className={cn(
									'relative rounded-xl border transition-all overflow-hidden cursor-pointer group',
									isEngaged
										? 'bg-mnx-neon/[0.04] border-mnx-neon/25 shadow-[0_0_12px_rgba(81,255,181,0.08)]'
										: 'bg-white/[0.02] border-white/[0.06] hover:border-white/10',
								)}
								onClick={() => setExpandedGame(isExpanded ? null : game.id)}
							>
								{/* Thumbnail */}
								<div className="relative h-16 overflow-hidden bg-mnx-obsidian">
									{hasThumb ? (
										<img
											src={getThumbSrc(game.id)}
											alt={game.name}
											className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
										/>
									) : (
										<div className="w-full h-full bg-gradient-to-br from-mnx-blue/20 to-mnx-neon/10 flex items-center justify-center">
											<TbDeviceDesktopGamepad
												size={20}
												className="text-mnx-text-dim/40"
											/>
										</div>
									)}
									<div className="absolute inset-0 bg-gradient-to-t from-mnx-obsidian via-transparent to-transparent" />

									{/* Status Badges */}
									<div className="absolute top-1.5 left-1.5 flex gap-1">
										<span
											className={cn(
												'px-1.5 py-0.5 rounded-md text-[8px] font-black font-mono uppercase',
												`bg-mnx-obsidian/80 ${LAUNCHER_COLORS[game.launcher] || LAUNCHER_COLORS.unknown} text-white/90`,
											)}
										>
											{LAUNCHER_BADGES[game.launcher] || 'LOCAL'}
										</span>
										{(game.isRunning || isEngaged) && (
											<span className="px-1.5 py-0.5 rounded-md bg-mnx-neon/90 text-mnx-obsidian text-[8px] font-black font-mono flex items-center gap-0.5 animate-pulse">
												<TbPlayerPlay size={8} />
												RUNNING
											</span>
										)}
									</div>

									{/* Auto-optimize badge */}
									{game.autoOptimize && (
										<div className="absolute top-1.5 right-1.5">
											<span className="px-1.5 py-0.5 rounded-md bg-mnx-blue/80 text-white text-[8px] font-black font-mono flex items-center gap-0.5">
												<MdAutorenew size={8} />
												AUTO
											</span>
										</div>
									)}
								</div>

								{/* Game Info */}
								<div className="p-2">
									<h3 className="text-[11px] font-black text-mnx-text font-inter truncate">
										{game.name}
									</h3>
									<p className="text-[9px] text-mnx-text-dim font-mono truncate mt-0.5">
										{game.executable || 'No executable'}
									</p>
								</div>

								{/* Expanded Controls */}
								<AnimatePresence>
									{isExpanded && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											className="border-t border-white/[0.04] overflow-hidden"
											onClick={(e) => e.stopPropagation()}
										>
											<div className="p-2.5 space-y-2">
												{/* Auto-Optimize Toggle */}
												<div className="flex items-center justify-between">
													<span className="text-[10px] text-mnx-text-dim font-inter">
														Auto-Optimize on Launch
													</span>
													<button
														onClick={() =>
															onAutoOptimizeToggle(game.id)
														}
														className={cn(
															'w-8 h-4 rounded-full transition-all relative',
															game.autoOptimize
																? 'bg-mnx-neon/30'
																: 'bg-white/10',
														)}
													>
														<div
															className={cn(
																'absolute top-0.5 w-3 h-3 rounded-full transition-all',
																game.autoOptimize
																	? 'left-4 bg-mnx-neon'
																	: 'left-0.5 bg-white/40',
															)}
														/>
													</button>
												</div>

												{/* Mode Selector */}
												<div className="flex gap-1">
													{(['dns_only', 'full_boost'] as const).map(
														(mode) => (
															<button
																key={mode}
																onClick={() =>
																	onModeChange(game.id, mode)
																}
																className={cn(
																	'flex-1 py-1 rounded-md text-[9px] font-bold font-mono transition-all',
																	game.preferredMode === mode
																		? mode === 'full_boost'
																			? 'bg-mnx-neon/20 text-mnx-neon border border-mnx-neon/25'
																			: 'bg-mnx-blue/20 text-mnx-blue border border-mnx-blue/25'
																		: 'bg-white/5 text-mnx-text-dim border border-white/5',
																)}
															>
																{mode === 'dns_only'
																	? 'DNS Only'
																	: 'Full Boost'}
															</button>
														),
													)}
												</div>

												{/* Region Selector */}
												<div className="flex items-center gap-1.5">
													<MdLocationOn
														size={10}
														className="text-mnx-text-dim shrink-0"
													/>
													<select
														value={game.preferredRegion}
														onChange={(e) =>
															onRegionChange(
																game.id,
																e.target.value,
															)
														}
														className="flex-1 bg-white/5 border border-white/5 rounded-md px-2 py-1 text-[10px] text-mnx-text font-inter focus:outline-none focus:border-mnx-blue/30 appearance-none cursor-pointer"
													>
														{REGION_OPTIONS.map((r) => (
															<option
																key={r.id}
																value={r.id}
																className="bg-mnx-obsidian text-mnx-text"
															>
																{r.flag} {r.label}
															</option>
														))}
													</select>
												</div>

												{/* Executable Info */}
												<div className="flex items-center gap-1.5 text-[9px] text-mnx-text-dim font-mono">
													<TbServer size={9} />
													<span className="truncate">{game.executable}</span>
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						)
					})}
				</AnimatePresence>
			</div>
		</div>
	)
}
