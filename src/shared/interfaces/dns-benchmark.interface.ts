import type { Server } from './server.interface'

export type DnsBenchmarkStatus = 'ok' | 'blocked' | 'error' | 'failed'

export interface DnsBenchmarkResult {
	key: string
	name: string
	ping: number
	status: DnsBenchmarkStatus
	statusCode: number | null
	message: string
}

export interface DnsBenchmarkRequest {
	targetUrl: string
	servers: Server[]
}

export interface DnsBenchmarkResponse {
	success: boolean
	results: DnsBenchmarkResult[]
	message?: string
}
