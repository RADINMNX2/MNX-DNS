import { userLogger } from '../../shared/logger'
import type { AppProfile, GameProfile, RoutingTier } from './app-profiles'
import { getProfileTier } from './app-profiles'
import type { AetherService } from '../aether/aether.service'
import type { WinDivertService } from '../windivert/windivert.service'
import type { WireGuardService } from '../wireguard/wireguard.service'
import { WinDivertFilterBuilder } from './filter-builder'

export interface ProfileState {
	profileId: string
	type: 'game' | 'voice' | 'media' | 'browser'
	enabled: boolean
	mode: 'dns_only' | 'full_boost'
	region?: string
	tier: RoutingTier
	startedAt?: number
	stats: ProfileStats
}

export interface ProfileStats {
	routePackets: number
	bypassPackets: number
	tunnelBytes: { rx: number; tx: number }
}

export interface DispatcherStatus {
	activeProfiles: ProfileState[]
	totalActive: number
	gameFastpathActive: boolean
	voiceTunnelActive: boolean
	mediaBypassActive: boolean
	windivertRunning: boolean
	aetherRunning: boolean
	wireguardConnected: boolean
}

export class RoutingDispatcher {
	private profiles: Map<string, ProfileState> = new Map()
	private aether: AetherService
	private windivert: WinDivertService
	private wireguard: WireGuardService
	private filterBuilder: WinDivertFilterBuilder
	private dispatchInterval: NodeJS.Timeout | null = null

	constructor(
		aether: AetherService,
		windivert: WinDivertService,
		wireguard: WireGuardService
	) {
		this.aether = aether
		this.windivert = windivert
		this.wireguard = wireguard
		this.filterBuilder = new WinDivertFilterBuilder()
	}

	activateProfile(
		profile: AppProfile | GameProfile,
		mode: 'dns_only' | 'full_boost' = 'dns_only',
		region?: string
	): void {
		const tier = this.isGameProfile(profile)
			? 'game_fastpath'
			: getProfileTier(profile as AppProfile)

		const state: ProfileState = {
			profileId: profile.id,
			type: this.isGameProfile(profile) ? 'game' : (profile as AppProfile).type,
			enabled: true,
			mode,
			region,
			tier,
			startedAt: Date.now(),
			stats: {
				routePackets: 0,
				bypassPackets: 0,
				tunnelBytes: { rx: 0, tx: 0 },
			},
		}

		this.profiles.set(profile.id, state)
		userLogger.info(
			`Profile activated: ${profile.id} [${tier}] mode=${mode} region=${region || 'auto'}`
		)

		this.reconfigureTiers()
	}

	deactivateProfile(profileId: string): void {
		const state = this.profiles.get(profileId)
		if (state) {
			state.enabled = false
			this.profiles.delete(profileId)
			userLogger.info(`Profile deactivated: ${profileId}`)
			this.reconfigureTiers()
		}
	}

	toggleProfile(
		profile: AppProfile | GameProfile,
		mode: 'dns_only' | 'full_boost' = 'dns_only',
		region?: string
	): boolean {
		const existing = this.profiles.get(profile.id)
		if (existing?.enabled) {
			this.deactivateProfile(profile.id)
			return false
		}
		this.activateProfile(profile, mode, region)
		return true
	}

	private reconfigureTiers(): void {
		const activeProfiles = Array.from(this.profiles.values()).filter(
			(p) => p.enabled
		)

		const gameProfiles = activeProfiles.filter((p) => p.tier === 'game_fastpath')
		const voiceProfiles = activeProfiles.filter((p) => p.tier === 'voice_tunnel')
		const mediaProfiles = activeProfiles.filter((p) => p.tier === 'media_bypass')

		this.configureGameTier(gameProfiles)
		this.configureVoiceTier(voiceProfiles)
		this.configureMediaTier(mediaProfiles)
		this.updateWinDivertFilter()
	}

	private configureGameTier(profiles: ProfileState[]): void {
		if (profiles.length === 0) return

		userLogger.info(
			`Configuring Game FastPath for ${profiles.length} profiles`
		)

		for (const profile of profiles) {
			if (profile.mode === 'full_boost') {
				userLogger.info(
					`  -> ${profile.profileId}: Full Ping Boost (direct routing)`
				)
			} else {
				userLogger.info(
					`  -> ${profile.profileId}: DNS Bypass Only`
				)
			}
		}
	}

	private configureVoiceTier(profiles: ProfileState[]): void {
		if (profiles.length === 0) return

		userLogger.info(
			`Configuring Voice Tunnel for ${profiles.length} profiles`
		)

		const needsAether = profiles.some((p) => p.mode === 'full_boost')
		if (needsAether && !this.aether.isRunning()) {
			userLogger.info('Starting Aether for voice tunnel...')
		}
	}

	private configureMediaTier(profiles: ProfileState[]): void {
		if (profiles.length === 0) return

		userLogger.info(
			`Configuring Media Bypass for ${profiles.length} profiles`
		)

		const needsAether = profiles.some((p) => p.mode === 'full_boost')
		if (needsAether && !this.aether.isRunning()) {
			userLogger.info('Starting Aether for media bypass...')
		}
	}

	private updateWinDivertFilter(): void {
		const activeProfiles = Array.from(this.profiles.values()).filter(
			(p) => p.enabled
		)

		const filter = this.filterBuilder.buildFilter(activeProfiles)
		userLogger.info(`WinDivert filter updated: ${filter}`)
	}

	private isGameProfile(
		profile: AppProfile | GameProfile
	): profile is GameProfile {
		return 'executables' in profile && 'regions' in profile && !('domains' in profile)
	}

	getActiveProfiles(): ProfileState[] {
		return Array.from(this.profiles.values()).filter((p) => p.enabled)
	}

	getStatus(): DispatcherStatus {
		const active = this.getActiveProfiles()
		return {
			activeProfiles: active,
			totalActive: active.length,
			gameFastpathActive: active.some((p) => p.tier === 'game_fastpath'),
			voiceTunnelActive: active.some((p) => p.tier === 'voice_tunnel'),
			mediaBypassActive: active.some((p) => p.tier === 'media_bypass'),
			windivertRunning: this.windivert.isRunning(),
			aetherRunning: this.aether.isRunning(),
			wireguardConnected: this.wireguard.isConnected(),
		}
	}

	profileHasActivity(profileId: string): boolean {
		const state = this.profiles.get(profileId)
		if (!state) return false
		return (
			state.stats.routePackets > 0 ||
			state.stats.tunnelBytes.rx > 0 ||
			state.stats.tunnelBytes.tx > 0
		)
	}

	getProfileStats(profileId: string): ProfileStats | null {
		return this.profiles.get(profileId)?.stats || null
	}

	async shutdown(): Promise<void> {
		this.profiles.clear()
		this.stopDispatching()
		userLogger.info('Routing dispatcher shut down')
	}

	private startDispatching(): void {
		this.stopDispatching()
		this.dispatchInterval = setInterval(() => {
			this.dispatchCycle()
		}, 1000)
	}

	private stopDispatching(): void {
		if (this.dispatchInterval) {
			clearInterval(this.dispatchInterval)
			this.dispatchInterval = null
		}
	}

	private dispatchCycle(): void {
		// Periodic stats collection and tier health checks
	}
}
