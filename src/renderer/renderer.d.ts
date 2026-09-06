import { ipcPreload, uiPreload } from '../preload'

declare global {
	interface Window {
		ipc: typeof ipcPreload
		ui: typeof uiPreload
		os: {
			os: string
			getInterfaces: () => Promise<any>
		}
		storePreload: {
			get: <T extends any>(key: T) => any
		}
	}
}
