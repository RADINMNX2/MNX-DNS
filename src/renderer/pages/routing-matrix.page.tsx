import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { GameHub, type GameProfile } from '../component/game-hub/game-hub.component'
import { AppsHub, type AppProfile } from '../component/apps-hub/apps-hub.component'
import { ActiveTunnelHUD } from '../component/active-tunnel-hud/active-tunnel-hud.component'
import { MyLibrary } from '../component/game-library/game-library.component'

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

interface ActiveProfile {
	profileId: string
	name: string
	type: 'game' | 'voice' | 'media' | 'browser'
	region?: string
	regionName?: string
	pingMs?: number
	mode: 'dns_only' | 'full_boost'
}

const DEFAULT_GAMES: GameProfile[] = [
	{
		id: 'valorant', name: 'Valorant', executables: ['VALORANT-Win64-Shipping.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'me', name: 'Bahrain', countryCode: 'BH', pingMs: 0 },
			{ id: 'tr', name: 'Istanbul', countryCode: 'TR', pingMs: 0 },
		], dnsOnly: false,
	},
	{
		id: 'cs2', name: 'CS2', executables: ['cs2.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'eu2', name: 'Amsterdam', countryCode: 'NL', pingMs: 0 },
			{ id: 'uk', name: 'London', countryCode: 'GB', pingMs: 0 },
		], dnsOnly: false,
	},
	{
		id: 'dota2', name: 'Dota 2', executables: ['dota2.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Virginia', countryCode: 'US', pingMs: 0 },
		], dnsOnly: false,
	},
	{
		id: 'fortnite', name: 'Fortnite', executables: ['FortniteClient-Win64-Shipping.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Oregon', countryCode: 'US', pingMs: 0 },
		], dnsOnly: false,
	},
	{
		id: 'apex', name: 'Apex Legends', executables: ['r5apex.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Oregon', countryCode: 'US', pingMs: 0 },
		], dnsOnly: false,
	},
	{
		id: 'r6siege', name: 'Rainbow Six', executables: ['RainbowSix.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Virginia', countryCode: 'US', pingMs: 0 },
		], dnsOnly: false,
	},
	{
		id: 'pubg', name: 'PUBG', executables: ['TslGame.exe'],
		regions: [
			{ id: 'asia', name: 'Seoul', countryCode: 'KR', pingMs: 0 },
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
		], dnsOnly: false,
	},
	{
		id: 'lol', name: 'League of Legends', executables: ['LeagueClient.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Chicago', countryCode: 'US', pingMs: 0 },
		], dnsOnly: false,
	},
]

const DEFAULT_APPS: AppProfile[] = [
	{
		id: 'discord', name: 'Discord', type: 'voice',
		executables: ['Discord.exe'],
		domains: ['discord.gg', 'discord.com', 'discordapp.com', 'discord.media', 'gateway.discord.gg'],
		enabled: false, mode: 'dns_only', icon: 'discord',
	},
	{
		id: 'spotify', name: 'Spotify', type: 'media',
		executables: ['Spotify.exe'],
		domains: ['spotify.com', 'scdn.co', 'spotifycdn.com'],
		enabled: false, mode: 'dns_only', icon: 'spotify',
	},
	{
		id: 'youtube', name: 'YouTube', type: 'media',
		executables: [],
		domains: ['youtube.com', 'youtu.be', 'googlevideo.com', 'ytimg.com'],
		enabled: false, mode: 'dns_only', icon: 'youtube',
	},
	{
		id: 'twitch', name: 'Twitch', type: 'media',
		executables: ['Twitch.exe'],
		domains: ['twitch.tv', 'jtvnw.net', 'ttvnw.net'],
		enabled: false, mode: 'dns_only', icon: 'twitch',
	},
	{
		id: 'steam', name: 'Steam', type: 'game',
		executables: ['steam.exe', 'steamwebhelper.exe'],
		domains: ['steampowered.com', 'steamcommunity.com', 'steamgames.com'],
		enabled: false, mode: 'dns_only', icon: 'steam',
	},
	{
		id: 'epicgames', name: 'Epic Games', type: 'game',
		executables: ['EpicGamesLauncher.exe'],
		domains: ['epicgames.com', 'unrealengine.com'],
		enabled: false, mode: 'dns_only', icon: 'epicgames',
	},
]

const REGION_NAMES: Record<string, string> = {
	eu: 'Frankfurt',
	eu2: 'Amsterdam',
	uk: 'London',
	us: 'Virginia',
	me: 'Bahrain',
	tr: 'Istanbul',
	asia: 'Seoul',
	ru: 'Moscow',
}

export function RoutingMatrixPage() {
	const [activeGames, setActiveGames] = useState<
		Map<string, { enabled: boolean; mode: 'dns_only' | 'full_boost'; region?: string }>
	>(new Map())
	const [activeApps, setActiveApps] = useState<
		Map<string, { enabled: boolean; mode: 'dns_only' | 'full_boost' }>
	>(new Map())
	const [activeProfiles, setActiveProfiles] = useState<ActiveProfile[]>([])

	// Installed games state
	const [installedGames, setInstalledGames] = useState<InstalledGame[]>([])
	const [scanning, setScanning] = useState(false)
	const [scanDuration, setScanDuration] = useState<number | null>(null)
	const [radarSnapshot, setRadarSnapshot] = useState<RadarSnapshot | null>(null)

	const loadInstalledGames = useCallback(async () => {
		try {
			const res = await window.ipc?.gamesGetInstalled()
			if (res?.ok && res.data?.games) {
				setInstalledGames(res.data.games)
				if (res.data.meta?.scanDuration) {
					setScanDuration(res.data.meta.scanDuration)
				}
			}
		} catch (e) {
			console.error('Failed to load installed games:', e)
		}
	}, [])

	const loadRadarStatus = useCallback(async () => {
		try {
			const res = await window.ipc?.radarStatus()
			if (res?.ok && res.data) {
				setRadarSnapshot({
					running: res.data.running,
					engaged: res.data.engaged || [],
					watched: res.data.watched || [],
				})

				// Mark running games based on radar engaged
				if (res.data.engaged?.length > 0) {
					setInstalledGames((prev) =>
						prev.map((g) => ({
							...g,
							isRunning: res.data.engaged.some(
								(e: any) => e.gameId === g.id,
							),
						})),
					)
				}
			}
		} catch (e) {
			console.error('Failed to load radar status:', e)
		}
	}, [])

	const handleScan = useCallback(async () => {
		setScanning(true)
		try {
			const res = await window.ipc?.gamesScan(true)
			if (res?.ok && res.data) {
				setInstalledGames(res.data.games || [])
				setScanDuration(res.data.scanDuration || null)
			}
		} catch (e) {
			console.error('Scan failed:', e)
		} finally {
			setScanning(false)
		}
	}, [])

	const handleAutoOptimizeToggle = useCallback(async (gameId: string) => {
		setInstalledGames((prev) => {
			const next = prev.map((g) =>
				g.id === gameId ? { ...g, autoOptimize: !g.autoOptimize } : g,
			)
			const game = next.find((g) => g.id === gameId)
			if (game) {
				window.ipc?.gamesUpdatePreference({
					gameId,
					autoOptimize: game.autoOptimize,
				})
			}
			return next
		})
	}, [])

	const handleLibraryModeChange = useCallback(
		async (gameId: string, mode: 'dns_only' | 'full_boost') => {
			setInstalledGames((prev) =>
				prev.map((g) => (g.id === gameId ? { ...g, preferredMode: mode } : g)),
			)
			await window.ipc?.gamesUpdatePreference({
				gameId,
				preferredMode: mode,
			})
		},
		[],
	)

	const handleLibraryRegionChange = useCallback(
		async (gameId: string, region: string) => {
			setInstalledGames((prev) =>
				prev.map((g) => (g.id === gameId ? { ...g, preferredRegion: region } : g)),
			)
			await window.ipc?.gamesUpdatePreference({
				gameId,
				preferredRegion: region,
			})
		},
		[],
	)

	const handleRadarToggle = useCallback(
		async (enabled: boolean) => {
			await window.ipc?.radarToggle(enabled)
			await loadRadarStatus()
		},
		[loadRadarStatus],
	)

	useEffect(() => {
		loadInstalledGames()
		loadRadarStatus()

		// Listen for auto-engage events from main process
		const handleAutoEngaged = (_event: any, data: any) => {
			setInstalledGames((prev) =>
				prev.map((g) =>
					g.id === data.gameId ? { ...g, isRunning: true } : g,
				),
			)
			loadRadarStatus()
		}

		const handleAutoDisengaged = (_event: any, data: any) => {
			setInstalledGames((prev) =>
				prev.map((g) =>
					g.id === data.gameId ? { ...g, isRunning: false } : g,
				),
			)
			loadRadarStatus()
		}

		window.ipc?.on('game:auto-engaged', handleAutoEngaged)
		window.ipc?.on('game:auto-disengaged', handleAutoDisengaged)

		return () => {
			window.ipc?.off('game:auto-engaged', handleAutoEngaged)
			window.ipc?.off('game:auto-disengaged', handleAutoDisengaged)
		}
	}, [loadInstalledGames, loadRadarStatus])

	const buildActiveProfiles = useCallback(() => {
		const profiles: ActiveProfile[] = []

		for (const [gameId, state] of activeGames.entries()) {
			if (!state.enabled) continue
			const game = DEFAULT_GAMES.find((g) => g.id === gameId)
			if (!game) continue

			profiles.push({
				profileId: gameId,
				name: game.name,
				type: 'game',
				region: state.region,
				regionName: state.region ? REGION_NAMES[state.region] : undefined,
				mode: state.mode,
			})
		}

		for (const [appId, state] of activeApps.entries()) {
			if (!state.enabled) continue
			const app = DEFAULT_APPS.find((a) => a.id === appId)
			if (!app) continue

			profiles.push({
				profileId: appId,
				name: app.name,
				type: app.type,
				mode: state.mode,
			})
		}

		setActiveProfiles(profiles)
	}, [activeGames, activeApps])

	useEffect(() => {
		buildActiveProfiles()
	}, [activeGames, activeApps, buildActiveProfiles])

	const handleGameToggle = useCallback(async (gameId: string) => {
		setActiveGames((prev) => {
			const next = new Map(prev)
			const existing = next.get(gameId)
			if (existing?.enabled) {
				next.delete(gameId)
			} else {
				next.set(gameId, {
					enabled: true,
					mode: 'dns_only',
					region: DEFAULT_GAMES.find((g) => g.id === gameId)?.regions[0]?.id,
				})
			}
			return next
		})

		try {
			await window.ipc?.profileToggle({ profileId: gameId, type: 'game' })
		} catch (e) {
			console.error('Failed to toggle game profile:', e)
		}
	}, [])

	const handleGameModeChange = useCallback(async (gameId: string, mode: 'dns_only' | 'full_boost') => {
		setActiveGames((prev) => {
			const next = new Map(prev)
			const existing = next.get(gameId)
			if (existing) {
				next.set(gameId, { ...existing, mode })
			}
			return next
		})

		try {
			await window.ipc?.profileActivate({ profileId: gameId, type: 'game', mode })
		} catch (e) {
			console.error('Failed to change game mode:', e)
		}
	}, [])

	const handleGameRegionChange = useCallback(async (gameId: string, regionId: string) => {
		setActiveGames((prev) => {
			const next = new Map(prev)
			const existing = next.get(gameId)
			if (existing) {
				next.set(gameId, { ...existing, region: regionId })
			}
			return next
		})

		try {
			await window.ipc?.profileActivate({
				profileId: gameId,
				type: 'game',
				region: regionId,
			})
		} catch (e) {
			console.error('Failed to change game region:', e)
		}
	}, [])

	const handleAppToggle = useCallback(async (appId: string) => {
		setActiveApps((prev) => {
			const next = new Map(prev)
			const existing = next.get(appId)
			if (existing?.enabled) {
				next.delete(appId)
			} else {
				next.set(appId, { enabled: true, mode: 'dns_only' })
			}
			return next
		})

		try {
			await window.ipc?.profileToggle({ profileId: appId, type: 'app' })
		} catch (e) {
			console.error('Failed to toggle app profile:', e)
		}
	}, [])

	const handleAppModeChange = useCallback(async (appId: string, mode: 'dns_only' | 'full_boost') => {
		setActiveApps((prev) => {
			const next = new Map(prev)
			const existing = next.get(appId)
			if (existing) {
				next.set(appId, { ...existing, mode })
			}
			return next
		})

		try {
			await window.ipc?.profileActivate({ profileId: appId, type: 'app', mode })
		} catch (e) {
			console.error('Failed to change app mode:', e)
		}
	}, [])

	return (
		<div className="flex flex-col h-full bg-mnx-obsidian">
			<div className="flex-1 overflow-y-auto px-3 pb-16 space-y-5">
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="pt-3"
				>
					<div className="flex items-center gap-2 mb-1">
						<h1 className="text-lg font-black font-inter text-mnx-text tracking-tight">
							Routing Matrix
						</h1>
						{activeProfiles.length > 0 && (
							<span className="ml-auto px-2 py-0.5 rounded-full bg-mnx-neon/15 text-mnx-neon text-[10px] font-bold font-mono animate-pulse">
								{activeProfiles.length} ACTIVE
							</span>
						)}
					</div>
					<p className="text-[11px] text-mnx-text-dim font-inter">
						Isolated multi-tunnel routing for games, voice, and media
					</p>
				</motion.div>

				{/* My Installed Games Library */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.05 }}
				>
					<MyLibrary
						games={installedGames}
						radar={radarSnapshot}
						scanning={scanning}
						scanDuration={scanDuration}
						onScan={handleScan}
						onAutoOptimizeToggle={handleAutoOptimizeToggle}
						onModeChange={handleLibraryModeChange}
						onRegionChange={handleLibraryRegionChange}
						onRadarToggle={handleRadarToggle}
					/>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<GameHub
						games={DEFAULT_GAMES}
						activeGames={activeGames}
						onToggle={handleGameToggle}
						onModeChange={handleGameModeChange}
						onRegionChange={handleGameRegionChange}
					/>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<AppsHub
						apps={DEFAULT_APPS}
						activeApps={activeApps}
						onToggle={handleAppToggle}
						onModeChange={handleAppModeChange}
					/>
				</motion.div>
			</div>

			<ActiveTunnelHUD activeProfiles={activeProfiles} />
		</div>
	)
}
