import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'

interface ActiveProfile {
	profileId: string
	name: string
	type: 'game' | 'voice' | 'media' | 'browser'
	region?: string
	regionName?: string
	pingMs?: number
	mode: 'dns_only' | 'full_boost'
}

interface ActiveTunnelHUDProps {
	activeProfiles: ActiveProfile[]
}

const TYPE_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
	game: { bg: 'bg-mnx-neon/15', text: 'text-mnx-neon', glow: 'shadow-[0_0_8px_rgba(81,255,181,0.3)]' },
	voice: { bg: 'bg-purple-500/15', text: 'text-purple-400', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.3)]' },
	media: { bg: 'bg-red-500/15', text: 'text-red-400', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]' },
	browser: { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]' },
}

const TYPE_ICONS: Record<string, string> = {
	game: '\u{26A1}',
	voice: '\u{1F3A4}',
	media: '\u{25B6}\uFE0F',
	browser: '\u{1F310}',
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

function getPingColor(ms: number): string {
	if (ms < 30) return 'text-mnx-neon'
	if (ms < 60) return 'text-mnx-warning'
	return 'text-mnx-danger'
}

export function ActiveTunnelHUD({ activeProfiles }: ActiveTunnelHUDProps) {
	if (activeProfiles.length === 0) return null

	return (
		<motion.div
			initial={{ y: 20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			exit={{ y: 20, opacity: 0 }}
			className={cn(
				'fixed bottom-0 left-0 right-0 z-40',
				'bg-mnx-obsidian/90 backdrop-blur-xl border-t border-mnx-border/50',
				'px-3 py-2'
			)}
		>
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1.5 shrink-0">
					<motion.div
						className="w-2 h-2 rounded-full bg-mnx-neon"
						animate={{ scale: [1, 1.3, 1] }}
						transition={{ duration: 1.5, repeat: Infinity }}
					/>
					<span className="text-[10px] font-bold font-mono text-mnx-neon uppercase">
						Active Matrix
					</span>
					<span className="text-[10px] font-mono text-mnx-text-dim">
						({activeProfiles.length})
					</span>
				</div>

				<div className="w-px h-4 bg-mnx-border/50 shrink-0" />

				<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
					<AnimatePresence mode="popLayout">
						{activeProfiles.map((profile) => {
							const colors = TYPE_COLORS[profile.type] || TYPE_COLORS.game
							return (
								<motion.div
									key={profile.profileId}
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
									layout
									className={cn(
										'flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0',
										colors.bg,
										colors.glow
									)}
								>
									<span className="text-xs">{TYPE_ICONS[profile.type]}</span>
									<span className={cn('text-[11px] font-bold font-inter', colors.text)}>
										{profile.name}
									</span>
									{profile.region && (
										<span className="text-[9px] font-mono text-mnx-text-muted">
											{FLAG_EMOJIS[profile.region] || ''} {profile.regionName || profile.region}
										</span>
									)}
									{profile.pingMs !== undefined && profile.pingMs > 0 && (
										<span className={cn('text-[9px] font-mono font-bold', getPingColor(profile.pingMs))}>
											{profile.pingMs}ms
										</span>
									)}
									{profile.mode === 'full_boost' && (
										<span className="text-[8px] font-mono px-1 py-0.5 rounded bg-mnx-neon/20 text-mnx-neon">
											BOOST
										</span>
									)}
								</motion.div>
							)
						})}
					</AnimatePresence>
				</div>
			</div>
		</motion.div>
	)
}
