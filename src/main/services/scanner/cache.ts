import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { app } from 'electron'
import type { InstalledGame, ScanResult } from './types'

const CACHE_DIR = join(app.getPath('userData'), 'scanner')
const CACHE_FILE = join(CACHE_DIR, 'installed_games.json')
const CACHE_META_FILE = join(CACHE_DIR, 'scan_meta.json')

export interface ScanMeta {
	lastScanTimestamp: number
	scanDuration: number
	launchersScanned: string[]
	gameCount: number
}

export function loadCachedGames(): InstalledGame[] {
	try {
		if (!existsSync(CACHE_FILE)) return []
		const raw = readFileSync(CACHE_FILE, 'utf-8')
		const games = JSON.parse(raw) as InstalledGame[]
		return Array.isArray(games) ? games : []
	} catch {
		return []
	}
}

export function saveCachedGames(games: InstalledGame[]): void {
	try {
		if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
		writeFileSync(CACHE_FILE, JSON.stringify(games, null, 2), 'utf-8')
	} catch (err) {
		console.error('[ScannerCache] Failed to save games:', err)
	}
}

export function loadScanMeta(): ScanMeta | null {
	try {
		if (!existsSync(CACHE_META_FILE)) return null
		const raw = readFileSync(CACHE_META_FILE, 'utf-8')
		return JSON.parse(raw) as ScanMeta
	} catch {
		return null
	}
}

export function saveScanMeta(result: ScanResult): void {
	try {
		if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
		const meta: ScanMeta = {
			lastScanTimestamp: result.timestamp,
			scanDuration: result.scanDuration,
			launchersScanned: result.launchersScanned,
			gameCount: result.games.length,
		}
		writeFileSync(CACHE_META_FILE, JSON.stringify(meta, null, 2), 'utf-8')
	} catch (err) {
		console.error('[ScannerCache] Failed to save meta:', err)
	}
}

export function updateGameInCache(
	gameId: string,
	partial: Partial<InstalledGame>,
): InstalledGame[] {
	const games = loadCachedGames()
	const idx = games.findIndex((g) => g.id === gameId)
	if (idx >= 0) {
		games[idx] = { ...games[idx], ...partial }
	}
	saveCachedGames(games)
	return games
}
