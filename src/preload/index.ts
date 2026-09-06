// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'

import os from 'node:os'
import { store } from '../main/store/store'
import { EventsKeys } from '../shared/constants/eventsKeys.constant'
import { Server, ServerStore } from '../shared/interfaces/server.interface'
import {
	SettingInStore,
	StoreKey,
} from '../shared/interfaces/settings.interface'

export const ipcPreload = {
	setDns: (server: Server) => ipcRenderer.invoke(EventsKeys.SET_DNS, server),
	clearDns: () => ipcRenderer.invoke(EventsKeys.CLEAR_DNS),
	notif: (message: string) =>
		ipcRenderer.send(EventsKeys.NOTIFICATION, message),
	dialogError: (title: string, message: string) =>
		ipcRenderer.send(EventsKeys.DIALOG_ERROR, title, message),
	openBrowser: (url: string) => ipcRenderer.send(EventsKeys.OPEN_BROWSER, url),
	addDns: (data: Partial<Server>) =>
		ipcRenderer.invoke(EventsKeys.ADD_DNS, data),
	deleteDns: (server: Server) =>
		ipcRenderer.invoke(EventsKeys.DELETE_DNS, server),
	reloadServerList: (servers: Array<Server>) =>
		ipcRenderer.invoke(EventsKeys.RELOAD_SERVER_LIST, servers),
	fetchDnsList: () => ipcRenderer.invoke(EventsKeys.FETCH_DNS_LIST),
	getCurrentActive: () => ipcRenderer.invoke(EventsKeys.GET_CURRENT_ACTIVE),
	getSettings: () => ipcRenderer.invoke(EventsKeys.GET_SETTINGS),
	toggleStartUP: () => ipcRenderer.invoke(EventsKeys.TOGGLE_START_UP),
	flushDns: () => ipcRenderer.invoke(EventsKeys.FLUSHDNS),
	saveSettings: (settings: SettingInStore) =>
		ipcRenderer.invoke(EventsKeys.SAVE_SETTINGS, settings),
	ping: (server: Server) => ipcRenderer.invoke(EventsKeys.PING, server),
	benchmarkDns: (targetUrl: string, servers: Server[]) =>
		ipcRenderer.invoke(EventsKeys.BENCHMARK_DNS, { targetUrl, servers }),
	checkUpdate: () => ipcRenderer.invoke(EventsKeys.CHECK_UPDATE),
	startUpdate: () => ipcRenderer.invoke(EventsKeys.START_UPDATE),
	on: (channel: string, cb: any) => ipcRenderer.on(channel, cb),
	off: (channel: string, cb: any) => ipcRenderer.removeListener(channel, cb),
	close: () => ipcRenderer.send(EventsKeys.CLOSE),
	minimize: () => ipcRenderer.send(EventsKeys.MINIMIZE),
	togglePinServer: (server: ServerStore) =>
		ipcRenderer.invoke(EventsKeys.TOGGLE_PIN, server),
	openLogFile: () => ipcRenderer.send(EventsKeys.OPEN_LOG_FILE),
	openDevTools: () => ipcRenderer.send(EventsKeys.OPEN_DEV_TOOLS),
	scheduleShutdown: (data: {
		delay: number
		scheduledTime: Date
		description?: string
	}) => ipcRenderer.invoke(EventsKeys.SCHEDULE_SHUTDOWN, data),
	cancelScheduledShutdown: (shutdownId: string) =>
		ipcRenderer.invoke(EventsKeys.CANCEL_SCHEDULED_SHUTDOWN, shutdownId),
	clearAllShutdowns: () => ipcRenderer.invoke(EventsKeys.CLEAR_ALL_SHUTDOWNS),
	setInterfaceStatus: (name: string, enable: boolean) =>
		ipcRenderer.invoke(EventsKeys.SET_INTERFACE_STATUS, { name, enable }),
	switchNetworkType: (targetType: 'lan' | 'wifi' | 'both') =>
		ipcRenderer.invoke(EventsKeys.SWITCH_NETWORK_TYPE, targetType),
	networkStart: () => ipcRenderer.invoke(EventsKeys.NETWORK_ENGINE_START),
	networkStop: () => ipcRenderer.invoke(EventsKeys.NETWORK_ENGINE_STOP),
	networkStatus: () => ipcRenderer.invoke(EventsKeys.NETWORK_ENGINE_STATUS),
	tunnelConnect: (node: {
		id: string
		name: string
		region: string
		countryCode: string
		endpoint: string
		publicKey: string
	}) => ipcRenderer.invoke(EventsKeys.TUNNEL_CONNECT, node),
	tunnelDisconnect: () => ipcRenderer.invoke(EventsKeys.TUNNEL_DISCONNECT),
	tunnelStatus: () => ipcRenderer.invoke(EventsKeys.TUNNEL_STATUS),
	splitTunnelConfig: (config: {
		enabled: boolean
		bypassDomains: string[]
		gatewayCidrs: string[]
		excludeApps: string[]
	}) => ipcRenderer.invoke(EventsKeys.SPLIT_TUNNEL_CONFIG, config),
	getGameServers: () => ipcRenderer.invoke(EventsKeys.GET_GAME_SERVERS),
	aetherStart: (config?: any) => ipcRenderer.invoke(EventsKeys.AETHER_START, config),
	aetherStop: () => ipcRenderer.invoke(EventsKeys.AETHER_STOP),
	aetherStatus: () => ipcRenderer.invoke(EventsKeys.AETHER_STATUS),
	aetherUpdateConfig: (config: any) => ipcRenderer.invoke(EventsKeys.AETHER_UPDATE_CONFIG, config),
	profileToggle: (data: { profileId: string; type: 'game' | 'app'; mode?: string; region?: string }) =>
		ipcRenderer.invoke(EventsKeys.PROFILE_TOGGLE, data),
	profileActivate: (data: { profileId: string; type: 'game' | 'app'; mode?: string; region?: string }) =>
		ipcRenderer.invoke(EventsKeys.PROFILE_ACTIVATE, data),
	profileDeactivate: (profileId: string) =>
		ipcRenderer.invoke(EventsKeys.PROFILE_DEACTIVATE, profileId),
	getActiveProfiles: () => ipcRenderer.invoke(EventsKeys.GET_ACTIVE_PROFILES),
	getRoutingStatus: () => ipcRenderer.invoke(EventsKeys.GET_ROUTING_STATUS),
	getGameProfiles: () => ipcRenderer.invoke(EventsKeys.GET_GAME_PROFILES),
	getAppProfiles: () => ipcRenderer.invoke(EventsKeys.GET_APP_PROFILES),

	gamesScan: (force?: boolean) => ipcRenderer.invoke(EventsKeys.GAMES_SCAN, force),
	gamesGetInstalled: () => ipcRenderer.invoke(EventsKeys.GAMES_GET_INSTALLED),
	gamesUpdatePreference: (data: {
		gameId: string
		autoOptimize?: boolean
		preferredMode?: 'dns_only' | 'full_boost'
		preferredRegion?: string
	}) => ipcRenderer.invoke(EventsKeys.GAMES_UPDATE_PREFERENCE, data),
	radarToggle: (enabled: boolean) => ipcRenderer.invoke(EventsKeys.RADAR_TOGGLE, enabled),
	radarStatus: () => ipcRenderer.invoke(EventsKeys.RADAR_STATUS),
	radarSetConfig: (config: any) => ipcRenderer.invoke(EventsKeys.RADAR_SET_CONFIG, config),
}

export const uiPreload = {
	toggleTheme: (newTheme: string) =>
		ipcRenderer.invoke(EventsKeys.TOGGLE_THEME, newTheme),
}

export const osItems = {
	os: os.platform(),
	getInterfaces: () =>
		ipcRenderer.invoke(EventsKeys.GET_NETWORK_INTERFACE_LIST),
}

export const storePreload = {
	get: <T extends keyof StoreKey>(key: T) => store.get<T>(key),
}

contextBridge.exposeInMainWorld('ui', uiPreload)
contextBridge.exposeInMainWorld('ipc', ipcPreload)
contextBridge.exposeInMainWorld('os', osItems)
contextBridge.exposeInMainWorld('storePreload', storePreload)
