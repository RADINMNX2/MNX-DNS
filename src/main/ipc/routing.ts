import { ipcMain } from 'electron'
import { EventsKeys } from '../../shared/constants/eventsKeys.constant'
import { RoutingDispatcher } from '../services/routing/routing-dispatcher'
import { GAME_PROFILES, APP_PROFILES, type GameProfile, type AppProfile } from '../services/routing/app-profiles'
import { aetherService } from './aether'
import { networkEngine } from '../config'

const dispatcher = new RoutingDispatcher(
	aetherService,
	(networkEngine as any).windivert,
	(networkEngine as any).wireguard
)

ipcMain.handle(
	EventsKeys.PROFILE_TOGGLE,
	async (_, data: { profileId: string; type: 'game' | 'app'; mode?: 'dns_only' | 'full_boost'; region?: string }) => {
		try {
			const { profileId, type, mode, region } = data

			let profile: GameProfile | AppProfile | undefined

			if (type === 'game') {
				profile = GAME_PROFILES.find((g) => g.id === profileId)
			} else {
				profile = APP_PROFILES.find((a) => a.id === profileId)
			}

			if (!profile) {
				return { success: false, error: `Profile not found: ${profileId}` }
			}

			const activated = dispatcher.toggleProfile(profile, mode || 'dns_only', region)
			return {
				success: true,
				data: {
					activated,
					profileId,
					activeProfiles: dispatcher.getActiveProfiles(),
				},
			}
		} catch (error: any) {
			return { success: false, error: error?.message }
		}
	}
)

ipcMain.handle(
	EventsKeys.PROFILE_ACTIVATE,
	async (_, data: { profileId: string; type: 'game' | 'app'; mode?: 'dns_only' | 'full_boost'; region?: string }) => {
		try {
			const { profileId, type, mode, region } = data

			let profile: GameProfile | AppProfile | undefined

			if (type === 'game') {
				profile = GAME_PROFILES.find((g) => g.id === profileId)
			} else {
				profile = APP_PROFILES.find((a) => a.id === profileId)
			}

			if (!profile) {
				return { success: false, error: `Profile not found: ${profileId}` }
			}

			dispatcher.activateProfile(profile, mode || 'dns_only', region)
			return {
				success: true,
				data: { activeProfiles: dispatcher.getActiveProfiles() },
			}
		} catch (error: any) {
			return { success: false, error: error?.message }
		}
	}
)

ipcMain.handle(
	EventsKeys.PROFILE_DEACTIVATE,
	async (_, profileId: string) => {
		try {
			dispatcher.deactivateProfile(profileId)
			return {
				success: true,
				data: { activeProfiles: dispatcher.getActiveProfiles() },
			}
		} catch (error: any) {
			return { success: false, error: error?.message }
		}
	}
)

ipcMain.handle(EventsKeys.GET_ACTIVE_PROFILES, async () => {
	try {
		const active = dispatcher.getActiveProfiles()
		return { success: true, data: active }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.GET_ROUTING_STATUS, async () => {
	try {
		const status = dispatcher.getStatus()
		return { success: true, data: status }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.GET_GAME_PROFILES, async () => {
	try {
		return { success: true, data: GAME_PROFILES }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.GET_APP_PROFILES, async () => {
	try {
		return { success: true, data: APP_PROFILES }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

export { dispatcher as routingDispatcher }
