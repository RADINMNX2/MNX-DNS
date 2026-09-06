import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { userLogger } from '../../shared/logger'

export interface GameProfile {
	id: string
	name: string
	executables: string[]
	regions: ServerRegion[]
	dnsOnly: boolean
}

export interface ServerRegion {
	id: string
	name: string
	countryCode: string
	pingMs: number
}

export interface AppProfile {
	id: string
	name: string
	type: 'game' | 'voice' | 'media' | 'browser'
	executables: string[]
	domains: string[]
	enabled: boolean
	mode: 'dns_only' | 'full_boost'
	selectedRegion?: string
	icon?: string
}

export type RoutingTier = 'game_fastpath' | 'voice_tunnel' | 'media_bypass'

export const GAME_PROFILES: GameProfile[] = [
	{
		id: 'valorant',
		name: 'Valorant',
		executables: ['VALORANT-Win64-Shipping.exe', 'RiotClientServices.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'me', name: 'Bahrain', countryCode: 'BH', pingMs: 0 },
			{ id: 'tr', name: 'Istanbul', countryCode: 'TR', pingMs: 0 },
			{ id: 'ru', name: 'Moscow', countryCode: 'RU', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'cs2',
		name: 'CS2',
		executables: ['cs2.exe', 'cs2_linux'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'eu2', name: 'Amsterdam', countryCode: 'NL', pingMs: 0 },
			{ id: 'uk', name: 'London', countryCode: 'GB', pingMs: 0 },
			{ id: 'us', name: 'Chicago', countryCode: 'US', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'dota2',
		name: 'Dota 2',
		executables: ['dota2.exe', 'dota2'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Virginia', countryCode: 'US', pingMs: 0 },
			{ id: 'sea', name: 'Singapore', countryCode: 'SG', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'fortnite',
		name: 'Fortnite',
		executables: ['FortniteClient-Win64-Shipping.exe', 'FortniteLauncher.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Oregon', countryCode: 'US', pingMs: 0 },
			{ id: 'asia', name: 'Tokyo', countryCode: 'JP', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'apex',
		name: 'Apex Legends',
		executables: ['r5apex.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Oregon', countryCode: 'US', pingMs: 0 },
			{ id: 'asia', name: 'Tokyo', countryCode: 'JP', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'r6siege',
		name: 'Rainbow Six Siege',
		executables: ['RainbowSix.exe', 'RainbowSix_Vulkan.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Virginia', countryCode: 'US', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'pubg',
		name: 'PUBG',
	_executables: ['TslGame.exe'],
		regions: [
			{ id: 'asia', name: 'Seoul', countryCode: 'KR', pingMs: 0 },
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Seattle', countryCode: 'US', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'lol',
		name: 'League of Legends',
		executables: ['LeagueClient.exe', 'League of Legends.exe'],
		regions: [
			{ id: 'eu', name: 'Frankfurt', countryCode: 'DE', pingMs: 0 },
			{ id: 'us', name: 'Chicago', countryCode: 'US', pingMs: 0 },
		],
		dnsOnly: false,
	},
	{
		id: 'gtav',
		name: 'GTA V Online',
		executables: ['GTA5.exe'],
		regions: [
			{ id: 'eu', name: 'Amsterdam', countryCode: 'NL', pingMs: 0 },
			{ id: 'us', name: 'Los Angeles', countryCode: 'US', pingMs: 0 },
		],
		dnsOnly: true,
	},
	{
		id: 'rust',
		name: 'Rust',
		executables: ['RustClient.exe'],
		regions: [
			{ id: 'eu', name: 'London', countryCode: 'GB', pingMs: 0 },
			{ id: 'us', name: 'Dallas', countryCode: 'US', pingMs: 0 },
		],
		dnsOnly: false,
	},
]

export const APP_PROFILES: AppProfile[] = [
	{
		id: 'discord',
		name: 'Discord',
		type: 'voice',
		executables: ['Discord.exe', 'DiscordPTB.exe', 'DiscordCanary.exe'],
		domains: ['discord.gg', 'discord.com', 'discordapp.com', 'discord.media', 'cdn.discordapp.com', 'gateway.discord.gg'],
		enabled: false,
		mode: 'dns_only',
		icon: 'discord',
	},
	{
		id: 'spotify',
		name: 'Spotify',
		type: 'media',
		executables: ['Spotify.exe', 'SpotifyHelper.exe'],
		domains: ['spotify.com', 'scdn.co', 'spotifycdn.com', 'audio-ak-spotify-com.akamaized.net'],
		enabled: false,
		mode: 'dns_only',
		icon: 'spotify',
	},
	{
		id: 'youtube',
		name: 'YouTube',
		type: 'media',
		executables: [],
		domains: ['youtube.com', 'youtu.be', 'googlevideo.com', 'ytimg.com', 'yt3.ggpht.com'],
		enabled: false,
		mode: 'dns_only',
		icon: 'youtube',
	},
	{
		id: 'twitch',
		name: 'Twitch',
		type: 'media',
		executables: ['Twitch.exe'],
		domains: ['twitch.tv', 'jtvnw.net', 'ttvnw.net', 'twitchcdn.net'],
		enabled: false,
		mode: 'dns_only',
		icon: 'twitch',
	},
	{
		id: 'steam',
		name: 'Steam',
		type: 'game',
		executables: ['steam.exe', 'steamwebhelper.exe'],
		domains: ['steampowered.com', 'steamcommunity.com', 'steamgames.com', 'steamserver.net', 'valvesoftware.com'],
		enabled: false,
		mode: 'dns_only',
		icon: 'steam',
	},
	{
		id: 'epicgames',
		name: 'Epic Games',
		type: 'game',
		executables: ['EpicGamesLauncher.exe'],
		domains: ['epicgames.com', 'unrealengine.com', 'epicgames.dev'],
		enabled: false,
		mode: 'dns_only',
		icon: 'epicgames',
	},
]

export function getProfileTier(profile: AppProfile): RoutingTier {
	switch (profile.type) {
		case 'game':
			return 'game_fastpath'
		case 'voice':
			return 'voice_tunnel'
		case 'media':
		case 'browser':
			return 'media_bypass'
	}
}
