import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { app } from 'electron'
import { userLogger } from '../../shared/logger'
import {
	type InstalledGame,
	type GameLauncher,
	type ScanResult,
	type GameDatabaseEntry,
	KNOWN_GAMES,
} from './types'
import {
	loadCachedGames,
	saveCachedGames,
	loadScanMeta,
	saveScanMeta,
} from './cache'

const execAsync = promisify(exec)

const VDF_PATH_STEAM = 'C:\\Program Files (x86)\\Steam\\steamapps\\libraryfolders.vdf'
const RIOT_CLIENT_INSTALLS = 'C:\\ProgramData\\Riot Games\\RiotClientInstalls.json'
const EPIC_MANIFESTS = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'
const BATTLE_NET_GAMES = 'C:\\Program Files (x86)\\Warcraft III' // placeholder base
const EA_PROGRAMDATA = 'C:\\ProgramData\\Electronic Arts\\EA Desktop\\Data'
const UBISOFT_INSTALL = 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher'

export class GameScanner {
	private static instance: GameScanner
	private cachedGames: InstalledGame[] = []
	private scanMeta: ReturnType<typeof loadScanMeta> = null
	private scanning = false

	static getInstance(): GameScanner {
		if (!GameScanner.instance) {
			GameScanner.instance = new GameScanner()
		}
		return GameScanner.instance
	}

	constructor() {
		this.cachedGames = loadCachedGames()
		this.scanMeta = loadScanMeta()
	}

	async scan(force = false): Promise<ScanResult> {
		if (this.scanning) {
			userLogger.info('[GameScanner] Scan already in progress, returning cached')
			return this.buildResult(this.cachedGames, 0)
		}

		this.scanning = true
		const startTime = Date.now()
		const allGames: InstalledGame[] = []
		const launchersScanned: GameLauncher[] = []

		try {
			const [steamGames, riotGames, epicGames, registryGames] = await Promise.allSettled([
				this.scanSteam(),
				this.scanRiot(),
				this.scanEpic(),
				this.scanRegistry(),
			])

			if (steamGames.status === 'fulfilled' && steamGames.value.length > 0) {
				allGames.push(...steamGames.value)
				launchersScanned.push('steam')
			}
			if (riotGames.status === 'fulfilled' && riotGames.value.length > 0) {
				allGames.push(...riotGames.value)
				launchersScanned.push('riot')
			}
			if (epicGames.status === 'fulfilled' && epicGames.value.length > 0) {
				allGames.push(...epicGames.value)
				launchersScanned.push('epic')
			}
			if (registryGames.status === 'fulfilled' && registryGames.value.length > 0) {
				allGames.push(...registryGames.value)
				launchersScanned.push('ea', 'battle.net', 'ubisoft')
			}
		} catch (err) {
			userLogger.error('[GameScanner] Scan error:', err)
		}

		const deduplicated = this.deduplicate(allGames)
		const duration = Date.now() - startTime

		this.cachedGames = deduplicated
		const result = this.buildResult(deduplicated, duration, launchersScanned)
		this.scanMeta = {
			lastScanTimestamp: result.timestamp,
			scanDuration: result.scanDuration,
			launchersScanned: result.launchersScanned,
			gameCount: result.games.length,
		}

		saveCachedGames(deduplicated)
		saveScanMeta(result)
		this.scanning = false

		userLogger.info(
			`[GameScanner] Scan complete: ${deduplicated.length} games in ${duration}ms from ${launchersScanned.join(', ') || 'none'}`,
		)
		return result
	}

	getInstalled(): InstalledGame[] {
		return this.cachedGames
	}

	getMeta() {
		return this.scanMeta
	}

	private async scanSteam(): Promise<InstalledGame[]> {
		const games: InstalledGame[] = []
		const libraries = await this.getSteamLibraries()

		for (const libDir of libraries) {
			const appsDir = join(libDir, 'steamapps')
			if (!existsSync(appsDir)) continue

			try {
				const files = readdirSync(appsDir).filter(
					(f) => f.startsWith('appmanifest_') && f.endsWith('.acf'),
				)

				for (const acfFile of files) {
					try {
						const content = readFileSync(join(appsDir, acfFile), 'utf-8')
						const parsed = this.parseVdfLike(content)
						const name = parsed['name'] || ''
						const installDir = parsed['installdir'] || ''
						const appid = parsed['appid'] || ''

						if (!name || !installDir) continue

						const dbEntry = this.matchKnownGame(name, acfFile)
						const gameDir = join(appsDir, 'common', installDir)
						const exe = dbEntry
							? dbEntry.executables[0]
							: this.findMainExecutable(gameDir)

						games.push({
							id: dbEntry?.id || `steam_${appid}`,
							name,
							launcher: 'steam',
							executable: exe,
							installDir: gameDir,
							detectedAt: Date.now(),
							isRunning: false,
							autoOptimize: false,
							preferredMode: 'dns_only',
							preferredRegion: 'eu',
						})
					} catch {
						// skip malformed acf
					}
				}
			} catch {
				// skip unreadable dirs
			}
		}
		return games
	}

	private async getSteamLibraries(): Promise<string[]> {
		const libraries: string[] = []

		if (existsSync(VDF_PATH_STEAM)) {
			try {
				const content = readFileSync(VDF_PATH_STEAM, 'utf-8')
				const matches = content.match_all(/"path"\s+"([^"]+)"/g)
				for (const m of matches) {
					const normalized = m[1].replace(/\\\\/g, '\\').replace(/\//g, '\\')
					if (existsSync(normalized)) libraries.push(normalized)
				}
			} catch {
				// fallback
			}
		}

		if (libraries.length === 0) {
			const defaultPath = 'C:\\Program Files (x86)\\Steam'
			if (existsSync(defaultPath)) libraries.push(defaultPath)
		}

		return libraries
	}

	private async scanRiot(): Promise<InstalledGame[]> {
		const games: InstalledGame[] = []

		if (!existsSync(RIOT_CLIENT_INSTALLS)) return games

		try {
			const content = readFileSync(RIOT_CLIENT_INSTALLS, 'utf-8')
			const installs = JSON.parse(content)

			const rcHome = installs.rc_default || installs.rc_live || ''

			if (rcHome && existsSync(rcHome)) {
				const riotGames = [
					{
						id: 'valorant',
						name: 'VALORANT',
						sub: 'valorant',
						exe: 'VALORANT-Win64-Shipping.exe',
					},
					{
						id: 'lol',
						name: 'League of Legends',
						sub: 'league_of_legends',
						exe: 'LeagueClient.exe',
					},
				]

				for (const rg of riotGames) {
					const gamePath = join(rcHome, '..', rg.sub)
					const absPath = existsSync(gamePath) ? resolve(gamePath) : rcHome

					games.push({
						id: rg.id,
						name: rg.name,
						launcher: 'riot',
						executable: rg.exe,
						installDir: absPath,
						detectedAt: Date.now(),
						isRunning: false,
						autoOptimize: false,
						preferredMode: 'full_boost',
						preferredRegion: 'eu',
					})
				}
			}
		} catch (err) {
			userLogger.warn('[GameScanner] Riot scan failed:', err)
		}
		return games
	}

	private async scanEpic(): Promise<InstalledGame[]> {
		const games: InstalledGame[] = []

		if (!existsSync(EPIC_MANIFESTS)) return games

		try {
			const files = readdirSync(EPIC_MANIFESTS).filter((f) => f.endsWith('.item'))

			for (const file of files) {
				try {
					const content = readFileSync(join(EPIC_MANIFESTS, file), 'utf-8')
					const item = JSON.parse(content)
					const name = item.DisplayName || ''
					const installDir = item.InstallLocation || ''
					const launchExe = item.LaunchExecutable || ''

					if (!name) continue

					const dbEntry = this.matchKnownGame(name, file)
					const exe = launchExe || (dbEntry ? dbEntry.executables[0] : '')

					games.push({
						id: dbEntry?.id || `epic_${item.CatalogNamespace || name.toLowerCase().replace(/\s+/g, '_')}`,
						name,
						launcher: 'epic',
						executable: exe,
						installDir,
						detectedAt: Date.now(),
						isRunning: false,
						autoOptimize: false,
						preferredMode: 'dns_only',
						preferredRegion: 'eu',
					})
				} catch {
					// skip malformed
				}
			}
		} catch (err) {
			userLogger.warn('[GameScanner] Epic scan failed:', err)
		}
		return games
	}

	private async scanRegistry(): Promise<InstalledGame[]> {
		const games: InstalledGame[] = []

		const registryPaths = [
			'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
			'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
			'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
		]

		for (const regPath of registryPaths) {
			try {
				const { stdout } = await execAsync(
					`powershell -NoProfile -Command "Get-ItemProperty '${regPath}' | Select-Object DisplayName,InstallLocation,UninstallString | ConvertTo-Json -Depth 1"`,
					{ timeout: 8000 },
				)

				if (!stdout || stdout.trim() === '') continue
				let entries: any[]
				try {
					entries = JSON.parse(stdout.trim())
					if (!Array.isArray(entries)) entries = [entries]
				} catch {
					continue
				}

				for (const entry of entries) {
					const name = entry.DisplayName || ''
					const installDir = entry.InstallLocation || ''
					if (!name || !installDir) continue

					const dbEntry = this.matchKnownGame(name, '')
					if (!dbEntry) continue

					const gameDir = existsSync(installDir) ? installDir : ''
					if (!gameDir) continue

					const exe = this.findMainExecutable(gameDir) || dbEntry.executables[0]

					const launcher = dbEntry.launcher || 'unknown'
					games.push({
						id: dbEntry.id,
						name: dbEntry.name,
						launcher,
						executable: exe,
						installDir: gameDir,
						detectedAt: Date.now(),
						isRunning: false,
						autoOptimize: false,
						preferredMode: 'dns_only',
						preferredRegion: 'eu',
					})
				}
			} catch {
				// registry access may fail
			}
		}
		return games
	}

	private matchKnownGame(displayName: string, filename: string): GameDatabaseEntry | null {
		const lower = displayName.toLowerCase()
		const haystack = `${lower} ${filename.toLowerCase()}`

		for (const game of KNOWN_GAMES) {
			for (const kw of game.coverKeywords) {
				if (haystack.includes(kw.toLowerCase())) return game
			}
		}
		return null
	}

	private findMainExecutable(dir: string): string {
		try {
			if (!existsSync(dir)) return ''
			const candidates = readdirSync(dir).filter((f) => {
				if (!f.endsWith('.exe')) return false
				const lower = f.toLowerCase()
				return (
					!lower.includes('uninstall') &&
					!lower.includes('setup') &&
					!lower.includes('update') &&
					!lower.includes('crash') &&
					!lower.includes('launcher') &&
					!lower.includes('helper')
				)
			})
			if (candidates.length === 1) return candidates[0]

			const exe = candidates.find((f) => {
				const stat = statSync(join(dir, f))
				return stat.size > 1_000_000
			})
			return exe || candidates[0] || ''
		} catch {
			return ''
		}
	}

	private parseVdfLike(content: string): Record<string, string> {
		const result: Record<string, string> = {}
		const lines = content.split('\n')
		for (const line of lines) {
			const m = line.match(/^\s+"([^"]+)"\s+"([^"]+)"/)
			if (m) result[m[1]] = m[2]
		}
		return result
	}

	private deduplicate(games: InstalledGame[]): InstalledGame[] {
		const seen = new Map<string, InstalledGame>()
		for (const game of games) {
			const existing = seen.get(game.id)
			if (!existing || (game.installDir && !existing.installDir)) {
				seen.set(game.id, game)
			}
		}
		return Array.from(seen.values())
	}

	private buildResult(
		games: InstalledGame[],
		duration: number,
		launchers: GameLauncher[] = [],
	): ScanResult {
		return {
			games,
			scanDuration: duration,
			launchersScanned: launchers,
			timestamp: Date.now(),
		}
	}
}
