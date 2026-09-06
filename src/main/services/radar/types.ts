export interface RadarConfig {
	pollingIntervalMs: number
	autoEngageOnDetect: boolean
	autoDisengageOnExit: boolean
	notifyOnEngage: boolean
	maxConcurrentEngaged: number
}

export const DEFAULT_RADAR_CONFIG: RadarConfig = {
	pollingIntervalMs: 4000,
	autoEngageOnDetect: true,
	autoDisengageOnExit: true,
	notifyOnEngage: true,
	maxConcurrentEngaged: 3,
}

export interface RadarEvent {
	type: 'process_detected' | 'process_terminated' | 'profile_engaged' | 'profile_disengaged'
	gameId: string
	processName: string
	timestamp: number
	detail?: string
}
