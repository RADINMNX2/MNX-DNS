import { ipcMain } from 'electron'
import { EventsKeys } from '../../shared/constants/eventsKeys.constant'
import { networkEngine } from '../config'
import type { SplitTunnelConfig } from '../services/wireguard/types'

ipcMain.handle(EventsKeys.NETWORK_ENGINE_START, async () => {
	try {
		await networkEngine.startInterception()
		return { success: true }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.NETWORK_ENGINE_STOP, async () => {
	try {
		await networkEngine.stopInterception()
		return { success: true }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.NETWORK_ENGINE_STATUS, async () => {
	try {
		const status = networkEngine.getEngineStatus()
		const splitStats = networkEngine.getSplitTunnelStats()
		return { success: true, data: { ...status, splitTunnel: splitStats } }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(
	EventsKeys.TUNNEL_CONNECT,
	async (_, node: { id: string; name: string; region: string; countryCode: string; endpoint: string; publicKey: string }) => {
		try {
			await networkEngine.connectTunnel(node as any)
			return { success: true }
		} catch (error: any) {
			return { success: false, error: error?.message }
		}
	}
)

ipcMain.handle(EventsKeys.TUNNEL_DISCONNECT, async () => {
	try {
		await networkEngine.disconnectTunnel()
		return { success: true }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.TUNNEL_STATUS, async () => {
	try {
		const status = networkEngine.getEngineStatus()
		return { success: true, data: status.wireguard }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(
	EventsKeys.SPLIT_TUNNEL_CONFIG,
	async (_, config: SplitTunnelConfig) => {
		try {
			networkEngine.updateSplitTunnelConfig(config)
			return { success: true }
		} catch (error: any) {
			return { success: false, error: error?.message }
		}
	}
)

ipcMain.handle(EventsKeys.GET_GAME_SERVERS, async () => {
	try {
		const servers = networkEngine.getGameServers()
		const entries = Array.from(servers.entries()).map(
			([domain, category]) => ({ domain, category })
		)
		return { success: true, data: entries }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})
