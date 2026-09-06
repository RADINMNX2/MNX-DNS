import { ipcMain } from 'electron'
import { EventsKeys } from '../../shared/constants/eventsKeys.constant'
import { GameScanner } from '../services/scanner/GameScanner'
import { ProcessRadar } from '../services/radar/ProcessRadar'
import { updateGameInCache, loadCachedGames } from '../services/scanner/cache'
import { userLogger } from '../shared/logger'

const scanner = GameScanner.getInstance()
const radar = ProcessRadar.getInstance()

export function registerGameIpc(): void {
	ipcMain.handle(EventsKeys.GAMES_SCAN, async (_event, force?: boolean) => {
		try {
			const result = await scanner.scan(force)
			return { ok: true, data: result }
		} catch (err: any) {
			userLogger.error('[IPC] games:scan error:', err)
			return { ok: false, error: err.message }
		}
	})

	ipcMain.handle(EventsKeys.GAMES_GET_INSTALLED, () => {
		try {
			const games = scanner.getInstalled()
			const meta = scanner.getMeta()
			return { ok: true, data: { games, meta } }
		} catch (err: any) {
			return { ok: false, error: err.message }
		}
	})

	ipcMain.handle(
		EventsKeys.GAMES_UPDATE_PREFERENCE,
		(
			_event,
			data: {
				gameId: string
				autoOptimize?: boolean
				preferredMode?: 'dns_only' | 'full_boost'
				preferredRegion?: string
			},
		) => {
			try {
				const games = updateGameInCache(data.gameId, {
					...(data.autoOptimize !== undefined && { autoOptimize: data.autoOptimize }),
					...(data.preferredMode !== undefined && { preferredMode: data.preferredMode }),
					...(data.preferredRegion !== undefined && { preferredRegion: data.preferredRegion }),
				})

				// restart radar with updated prefs
				if (radar.isRunning()) {
					const autoGames = games.filter((g) => g.autoOptimize)
					radar.stop()
					if (autoGames.length > 0) radar.start(autoGames)
				}

				return { ok: true, data: games }
			} catch (err: any) {
				return { ok: false, error: err.message }
			}
		},
	)

	ipcMain.handle(EventsKeys.RADAR_TOGGLE, (_event, enabled: boolean) => {
		try {
			if (enabled) {
				const games = scanner.getInstalled()
				const autoGames = games.filter((g) => g.autoOptimize)
				radar.start(autoGames)
			} else {
				radar.stop()
			}
			return { ok: true, data: { running: radar.isRunning() } }
		} catch (err: any) {
			return { ok: false, error: err.message }
		}
	})

	ipcMain.handle(EventsKeys.RADAR_STATUS, () => {
		try {
			return {
				ok: true,
				data: {
					running: radar.isRunning(),
					engaged: radar.getEngagedGames(),
					watched: radar.getWatchedExecutables(),
					config: radar.getConfig(),
				},
			}
		} catch (err: any) {
			return { ok: false, error: err.message }
		}
	})

	ipcMain.handle(
		EventsKeys.RADAR_SET_CONFIG,
		(_event, config: Partial<import('../services/radar/types').RadarConfig>) => {
			try {
				radar.setConfig(config)
				return { ok: true, data: radar.getConfig() }
			} catch (err: any) {
				return { ok: false, error: err.message }
			}
		},
	)
}
