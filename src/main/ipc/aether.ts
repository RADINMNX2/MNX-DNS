import { ipcMain } from 'electron'
import { EventsKeys } from '../../shared/constants/eventsKeys.constant'
import { AetherService, type AetherConfig } from '../services/aether/aether.service'

const aetherService = new AetherService()

ipcMain.handle(EventsKeys.AETHER_START, async (_, config?: Partial<AetherConfig>) => {
	try {
		await aetherService.start(config)
		return { success: true, data: aetherService.getStatus() }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.AETHER_STOP, async () => {
	try {
		await aetherService.stop()
		return { success: true }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(EventsKeys.AETHER_STATUS, async () => {
	try {
		const status = aetherService.getStatus()
		return { success: true, data: status }
	} catch (error: any) {
		return { success: false, error: error?.message }
	}
})

ipcMain.handle(
	EventsKeys.AETHER_UPDATE_CONFIG,
	async (_, config: Partial<AetherConfig>) => {
		try {
			await aetherService.updateConfig(config)
			return { success: true, data: aetherService.getStatus() }
		} catch (error: any) {
			return { success: false, error: error?.message }
		}
	}
)

export { aetherService }
