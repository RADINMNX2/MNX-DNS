import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { EventEmitter } from 'node:events'
import { userLogger } from '../../shared/logger'
import type { InstalledGame } from '../scanner/types'
import type { RadarConfig, RadarEvent } from './types'
import { DEFAULT_RADAR_CONFIG } from './types'

const execAsync = promisify(exec)

export class ProcessRadar extends EventEmitter {
	private static instance: ProcessRadar

	private config: RadarConfig = { ...DEFAULT_RADAR_CONFIG }
	private pollingTimer: ReturnType<typeof setInterval> | null = null
	private running = false
	private watchingGames: Map<string, InstalledGame> = new Map()
	private currentlyEngaged: Map<string, { gameId: string; engagedAt: number }> = new Map()
	private previousProcessSet: Set<string> = new Set()

	static getInstance(): ProcessRadar {
		if (!ProcessRadar.instance) {
			ProcessRadar.instance = new ProcessRadar()
		}
		return ProcessRadar.instance
	}

	setConfig(partial: Partial<RadarConfig>): void {
		this.config = { ...this.config, ...partial }
		if (this.running) {
			this.stopPolling()
			this.startPolling()
		}
	}

	getConfig(): RadarConfig {
		return { ...this.config }
	}

	start(games: InstalledGame[]): void {
		if (this.running) return

		this.watchingGames.clear()
		for (const game of games) {
			if (game.autoOptimize && game.executable) {
				this.watchingGames.set(game.executable.toLowerCase(), game)
			}
		}

		if (this.watchingGames.size === 0) {
			userLogger.info('[ProcessRadar] No games with autoOptimize enabled, radar idle')
			return
		}

		this.running = true
		this.startPolling()
		userLogger.info(
			`[ProcessRadar] Started watching ${this.watchingGames.size} game processes (interval: ${this.config.pollingIntervalMs}ms)`,
		)
	}

	stop(): void {
		this.stopPolling()
		this.running = false
		this.disengageAll()
		userLogger.info('[ProcessRadar] Stopped')
	}

	isRunning(): boolean {
		return this.running
	}

	getWatchedExecutables(): string[] {
		return Array.from(this.watchingGames.keys())
	}

	getEngagedGames(): Array<{ gameId: string; engagedAt: number }> {
		return Array.from(this.currentlyEngaged.values())
	}

	private startPolling(): void {
		this.stopPolling()
		this.poll()
		this.pollingTimer = setInterval(() => this.poll(), this.config.pollingIntervalMs)
	}

	private stopPolling(): void {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer)
			this.pollingTimer = null
		}
	}

	private async poll(): Promise<void> {
		try {
			const { stdout } = await execAsync(
				'powershell -NoProfile -Command "Get-Process | Where-Object {$_.Path} | Select-Object -ExpandProperty Name | Sort-Object -Unique"',
				{ timeout: 3000 },
			)

			const currentProcesses = new Set<string>(
				stdout
					.split('\n')
					.map((l) => l.trim().toLowerCase())
					.filter((l) => l.length > 0),
			)

			this.detectNewLaunches(currentProcesses)
			this.detectExits(currentProcesses)
			this.previousProcessSet = currentProcesses
		} catch (err) {
			// polling failure - silent retry next cycle
		}
	}

	private detectNewLaunches(current: Set<string>): void {
		for (const [exeLower, game] of this.watchingGames) {
			const exeName = exeLower.replace('.exe', '')
			if (current.has(exeLower) || current.has(exeName)) {
				if (!this.currentlyEngaged.has(exeLower)) {
					this.engageGame(game, exeLower)
				}
			}
		}
	}

	private detectExits(current: Set<string>): void {
		if (!this.config.autoDisengageOnExit) return

		for (const [exeLower, engaged] of this.currentlyEngaged) {
			const exeName = exeLower.replace('.exe', '')
			if (!current.has(exeLower) && !current.has(exeName)) {
				this.disengageGame(exeLower, engaged.gameId)
			}
		}
	}

	private engageGame(game: InstalledGame, processName: string): void {
		this.currentlyEngaged.set(processName, {
			gameId: game.id,
			engagedAt: Date.now(),
		})

		const event: RadarEvent = {
			type: 'profile_engaged',
			gameId: game.id,
			processName,
			timestamp: Date.now(),
			detail: `Auto-engage: ${game.name} detected`,
		}

		userLogger.info(`[ProcessRadar] ENGAGE: ${game.name} (${processName})`)
		this.emit('game:engaged', event)
		this.emit('game:auto-engaged', {
			gameId: game.id,
			gameName: game.name,
			processName,
			region: game.preferredRegion,
			mode: game.preferredMode,
			timestamp: Date.now(),
		})
	}

	private disengageGame(processName: string, gameId: string): void {
		this.currentlyEngaged.delete(processName)

		const event: RadarEvent = {
			type: 'profile_disengaged',
			gameId,
			processName,
			timestamp: Date.now(),
			detail: `Auto-disengage: process exited`,
		}

		userLogger.info(`[ProcessRadar] DISENGAGE: ${gameId} (${processName})`)
		this.emit('game:disengaged', event)
		this.emit('game:auto-disengaged', {
			gameId,
			processName,
			timestamp: Date.now(),
		})
	}

	private disengageAll(): void {
		for (const [exe, engaged] of this.currentlyEngaged) {
			this.disengageGame(exe, engaged.gameId)
		}
		this.currentlyEngaged.clear()
	}
}
