export type GameLauncher =
	| 'steam'
	| 'riot'
	| 'epic'
	| 'battle.net'
	| 'ea'
	| 'ubisoft'
	| 'gog'
	| 'xbox'
	| 'unknown'

export interface InstalledGame {
	id: string
	name: string
	launcher: GameLauncher
	executable: string
	installDir: string
	coverImage?: string
	detectedAt: number
	isRunning: boolean
	autoOptimize: boolean
	preferredMode: 'dns_only' | 'full_boost'
	preferredRegion: string
}

export interface ScanResult {
	games: InstalledGame[]
	scanDuration: number
	launchersScanned: GameLauncher[]
	timestamp: number
}

export interface RadarStatus {
	enabled: boolean
	pollingIntervalMs: number
	runningProcesses: string[]
	engagedProfile: string | null
	engagedAt: number | null
	lastScanTimestamp: number | null
}

export interface GameDatabaseEntry {
	id: string
	name: string
	launcher: GameLauncher
	executables: string[]
	coverKeywords: string[]
}

export const KNOWN_GAMES: GameDatabaseEntry[] = [
	{
		id: 'valorant',
		name: 'VALORANT',
		launcher: 'riot',
		executables: ['VALORANT-Win64-Shipping.exe', 'RiotClientServices.exe'],
		coverKeywords: ['valorant', 'riot'],
	},
	{
		id: 'cs2',
		name: 'Counter-Strike 2',
		launcher: 'steam',
		executables: ['cs2.exe'],
		coverKeywords: ['counter-strike', 'cs2', 'csgo'],
	},
	{
		id: 'dota2',
		name: 'Dota 2',
		launcher: 'steam',
		executables: ['dota2.exe'],
		coverKeywords: ['dota', 'dota2'],
	},
	{
		id: 'fortnite',
		name: 'Fortnite',
		launcher: 'epic',
		executables: ['FortniteClient-Win64-Shipping.exe', 'FortniteLauncher.exe'],
		coverKeywords: ['fortnite'],
	},
	{
		id: 'apex',
		name: 'Apex Legends',
		launcher: 'ea',
		executables: ['r5apex.exe'],
		coverKeywords: ['apex', 'r5apex'],
	},
	{
		id: 'r6siege',
		name: 'Rainbow Six Siege',
		launcher: 'ubisoft',
		executables: ['RainbowSix.exe', 'RainbowSix_Vulkan.exe'],
		coverKeywords: ['rainbow', 'r6'],
	},
	{
		id: 'pubg',
		name: 'PUBG: Battlegrounds',
		launcher: 'steam',
		executables: ['TslGame.exe'],
		coverKeywords: ['pubg', 'battlegrounds'],
	},
	{
		id: 'lol',
		name: 'League of Legends',
		launcher: 'riot',
		executables: ['LeagueClient.exe', 'League of Legends.exe'],
		coverKeywords: ['league', 'riot'],
	},
	{
		id: 'gtav',
		name: 'Grand Theft Auto V',
		launcher: 'steam',
		executables: ['GTA5.exe', 'GTAV.exe'],
		coverKeywords: ['gta', 'grand theft'],
	},
	{
		id: 'rust',
		name: 'Rust',
		launcher: 'steam',
		executables: ['RustClient.exe'],
		coverKeywords: ['rust'],
	},
	{
		id: 'overwatch2',
		name: 'Overwatch 2',
		launcher: 'battle.net',
		executables: ['Overwatch.exe'],
		coverKeywords: ['overwatch'],
	},
	{
		id: 'warzone',
		name: 'Call of Duty: Warzone',
		launcher: 'battle.net',
		executables: ['ModernWarfare.exe', 'Warzone.exe'],
		coverKeywords: ['warzone', 'call of duty', 'modern warfare'],
	},
	{
		id: 'destiny2',
		name: 'Destiny 2',
		launcher: 'steam',
		executables: ['destiny2.exe'],
		coverKeywords: ['destiny'],
	},
	{
		id: 'pathofexile',
		name: 'Path of Exile',
		launcher: 'steam',
		executables: ['PathOfExile.exe', 'PathOfExileSteam.exe'],
		coverKeywords: ['path of exile', 'poe'],
	},
	{
		id: 'rocketleague',
		name: 'Rocket League',
		launcher: 'epic',
		executables: ['RocketLeague.exe'],
		coverKeywords: ['rocket league'],
	},
	{
		id: 'genshin',
		name: 'Genshin Impact',
		launcher: 'epic',
		executables: ['GenshinImpact.exe', 'YuanShen.exe'],
		coverKeywords: ['genshin', 'yuanshen'],
	},
	{
		id: 'lostark',
		name: 'Lost Ark',
		launcher: 'steam',
		executables: ['LostArk.exe'],
		coverKeywords: ['lost ark'],
	},
	{
		id: 'naraka',
		name: 'NARAKA: BLADEPOINT',
		launcher: 'steam',
		executables: ['NarakaBladepoint.exe'],
		coverKeywords: ['naraka', 'bladepoint'],
	},
	{
		id: 'thefinals',
		name: 'THE FINALS',
		launcher: 'steam',
		executables: ['Discovery.exe'],
		coverKeywords: ['the finals', 'discovery'],
	},
	{
		id: 'marvelrivals',
		name: 'Marvel Rivals',
		launcher: 'steam',
		executables: ['MarvelRivals.exe'],
		coverKeywords: ['marvel rivals'],
	},
]
