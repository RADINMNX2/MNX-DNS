import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface AppProfile {
	id: string
	name: string
	type: 'game' | 'voice' | 'media' | 'browser'
	executables: string[]
	domains: string[]
	enabled: boolean
	mode: 'dns_only' | 'full_boost'
	icon?: string
}

interface AppsHubProps {
	apps: AppProfile[]
	activeApps: Map<string, { enabled: boolean; mode: 'dns_only' | 'full_boost' }>
	onToggle: (appId: string) => void
	onModeChange: (appId: string, mode: 'dns_only' | 'full_boost') => void
}

const APP_ICONS: Record<string, { emoji: string; color: string; bgColor: string }> = {
	discord: {
		emoji: '\u{1F3AC}',
		color: '#5865F2',
		bgColor: 'rgba(88, 101, 242, 0.15)',
	},
	spotify: {
		emoji: '\u{1F3B5}',
		color: '#1DB954',
		bgColor: 'rgba(29, 185, 84, 0.15)',
	},
	youtube: {
		emoji: '\u{25B6}\uFE0F',
		color: '#FF0000',
		bgColor: 'rgba(255, 0, 0, 0.15)',
	},
	twitch: {
		emoji: '\u{1F4FA}',
		color: '#9146FF',
		bgColor: 'rgba(145, 70, 255, 0.15)',
	},
	steam: {
		emoji: '\u{1F5A5}\uFE0F',
		color: '#66C0F4',
		bgColor: 'rgba(102, 192, 244, 0.15)',
	},
	epicgames: {
		emoji: '\u{2B50}',
		color: '#FFFFFF',
		bgColor: 'rgba(255, 255, 255, 0.1)',
	},
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
	voice: { label: 'VoIP', color: 'text-purple-400' },
	media: { label: 'Streaming', color: 'text-red-400' },
	game: { label: 'Gaming', color: 'text-mnx-neon' },
	browser: { label: 'Web', color: 'text-blue-400' },
}

export function AppsHub({ apps, activeApps, onToggle, onModeChange }: AppsHubProps) {
	const [expandedApp, setExpandedApp] = useState<string | null>(null)

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 px-1">
				<span className="text-lg">\u{1F4F1}</span>
				<h2 className="text-sm font-bold font-inter text-mnx-text tracking-wide uppercase">
					Apps & Media
				</h2>
				<span className="ml-auto text-[10px] font-mono text-mnx-text-dim">
					{Array.from(activeApps.values()).filter((a) => a.enabled).length}/{apps.length} active
				</span>
			</div>

			<div className="space-y-2">
				{apps.map((app) => {
					const state = activeApps.get(app.id)
					const isActive = state?.enabled ?? false
					const mode = state?.mode ?? 'dns_only'
					const iconData = APP_ICONS[app.id] || { emoji: '\u{1F4F1}', color: '#888', bgColor: 'rgba(136,136,136,0.1)' }
					const typeInfo = TYPE_LABELS[app.type] || { label: app.type, color: 'text-mnx-text-dim' }
					const isExpanded = expandedApp === app.id

					return (
						<motion.div
							key={app.id}
							layout
							className={cn(
								'relative rounded-xl border p-3 transition-all duration-300',
								isActive
									? 'border-l-2 bg-mnx-surface/80'
									: 'bg-mnx-surface border-mnx-border hover:border-mnx-primary/20'
							)}
							style={isActive ? { borderLeftColor: iconData.color } : undefined}
						>
							<div className="flex items-center gap-3">
								<div
									className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
									style={{ backgroundColor: iconData.bgColor }}
								>
									{iconData.emoji}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-sm font-bold font-inter text-mnx-text">
											{app.name}
										</span>
										<span className={cn('text-[9px] font-mono', typeInfo.color)}>
											{typeInfo.label}
										</span>
										{isActive && (
											<span className="flex items-center gap-1">
												<span className="w-1.5 h-1.5 rounded-full bg-mnx-neon animate-pulse" />
												<span className="text-[9px] font-mono text-mnx-neon">ACTIVE</span>
											</span>
										)}
									</div>

									<div className="flex items-center gap-1.5 mt-1">
										<span
											className={cn(
												'text-[9px] font-mono px-1.5 py-0.5 rounded-md',
												isActive
													? 'bg-mnx-primary/15 text-mnx-primary'
													: 'bg-mnx-elevated text-mnx-text-dim'
											)}
										>
											{mode === 'full_boost' ? 'FULL BOOST' : 'DNS BYPASS'}
										</span>
										{app.domains.length > 0 && (
											<span className="text-[9px] font-mono text-mnx-text-dim">
												{app.domains.length} domains
											</span>
										)}
									</div>
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={() => setExpandedApp((prev) => (prev === app.id ? null : app.id))}
										className="p-1 rounded-md text-mnx-text-dim hover:text-mnx-text hover:bg-mnx-elevated transition-colors"
									>
										<svg
											className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')}
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
									</button>

									<button
										onClick={() => onToggle(app.id)}
										className={cn(
											'w-10 h-5 rounded-full transition-all duration-300 relative cursor-pointer',
											isActive ? 'shadow-[0_0_8px_rgba(12,140,233,0.4)]' : 'bg-mnx-border'
										)}
										style={isActive ? { backgroundColor: iconData.color } : undefined}
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
										<div className="pt-3 mt-3 border-t border-mnx-border/50 space-y-2">
											<div className="flex items-center gap-2">
												<span className="text-[10px] font-medium text-mnx-text-muted">Mode:</span>
												<div className="flex gap-1">
													<button
														onClick={() => onModeChange(app.id, 'dns_only')}
														className={cn(
															'px-2 py-0.5 text-[10px] font-mono rounded-md transition-all',
															mode === 'dns_only'
																? 'bg-mnx-primary text-white'
																: 'bg-mnx-elevated text-mnx-text-dim hover:text-mnx-text'
														)}
													>
														DNS Bypass
													</button>
													<button
														onClick={() => onModeChange(app.id, 'full_boost')}
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

											{app.domains.length > 0 && (
												<div>
													<span className="text-[10px] font-medium text-mnx-text-muted block mb-1">
														Protected Domains:
													</span>
													<div className="flex flex-wrap gap-1">
														{app.domains.slice(0, 6).map((d) => (
															<span
																key={d}
																className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-mnx-elevated text-mnx-text-dim"
															>
																{d}
															</span>
														))}
														{app.domains.length > 6 && (
															<span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-mnx-elevated text-mnx-text-dim">
																+{app.domains.length - 6} more
															</span>
														)}
													</div>
												</div>
											)}
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
