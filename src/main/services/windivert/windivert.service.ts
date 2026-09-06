import { join } from 'node:path'
import { app } from 'electron'
import { userLogger } from '../../shared/logger'
import type { WinDivertConfig, DnsPacket, InterceptionStats } from './types'
import { WinDivertLayer, WinDivertFlag } from './types'

const DEFAULT_DNS_FILTER =
	'udp.DstPort == 53 and (ip or ipv6) and not loopback'

export class WinDivertService {
	private handle: number | null = null
	private running = false
	private stats: InterceptionStats = {
		packetsCaptured: 0,
		packetsReinjected: 0,
		packetsDropped: 0,
		dnsQueriesIntercepted: 0,
		startTime: 0,
		lastActivity: 0,
	}
	private dnsInterceptor: ((packet: DnsPacket) => DnsPacket | null) | null =
		null

	constructor() {}

	getBinariesPath(): string {
		if (app.isPackaged) {
			return join(process.resourcesPath, 'binaries', 'windivert')
		}
		return join(__dirname, '..', '..', '..', '..', 'binaries', 'windivert')
	}

	async start(filter?: string): Promise<void> {
		if (this.running) {
			userLogger.warn('WinDivert already running, ignoring start()')
			return
		}

		const config: WinDivertConfig = {
			filter: filter || DEFAULT_DNS_FILTER,
			layer: WinDivertLayer.WINDIVERT_LAYER_NETWORK,
			priority: 0,
			flags: WinDivertFlag.WINDIVERT_FLAG_SNIFF,
		}

		userLogger.info(
			`Starting WinDivert with filter: ${config.filter}`
		)

		try {
			await this.loadDriver()
			this.running = true
			this.stats = {
				packetsCaptured: 0,
				packetsReinjected: 0,
				packetsDropped: 0,
				dnsQueriesIntercepted: 0,
				startTime: Date.now(),
				lastActivity: Date.now(),
			}
			userLogger.info('WinDivert started successfully')
		} catch (error: any) {
			userLogger.error('Failed to start WinDivert:', error?.message)
			throw error
		}
	}

	private async loadDriver(): Promise<void> {
		const binPath = this.getBinariesPath()
		userLogger.info(`Loading WinDivert driver from: ${binPath}`)
		// Native driver loading will be implemented via N-API binding
		// For now, validate that binaries exist
		const { existsSync } = await import('node:fs')
		const dllPath = join(binPath, 'WinDivert.dll')
		const sysPath = join(binPath, 'WinDivert64.sys')

		if (!existsSync(dllPath)) {
			throw new Error(`WinDivert.dll not found at: ${dllPath}`)
		}
		if (!existsSync(sysPath)) {
			throw new Error(`WinDivert64.sys not found at: ${sysPath}`)
		}
	}

	async stop(): Promise<void> {
		if (!this.running) return

		userLogger.info('Stopping WinDivert...')
		this.running = false
		this.handle = null
		userLogger.info('WinDivert stopped')
	}

	onDnsPacket(callback: (packet: DnsPacket) => DnsPacket | null): void {
		this.dnsInterceptor = callback
	}

	capturePacket(rawPacket: Buffer): DnsPacket | null {
		if (!this.running) return null

		this.stats.packetsCaptured++
		this.stats.lastActivity = Date.now()

		const packet = this.parseDnsPacket(rawPacket)
		if (!packet) return null

		this.stats.dnsQueriesIntercepted++

		if (this.dnsInterceptor) {
			return this.dnsInterceptor(packet)
		}
		return packet
	}

	private parseDnsPacket(raw: Buffer): DnsPacket | null {
		if (raw.length < 28) return null

		try {
			const ipHeaderLen = (raw[0] & 0x0f) * 4
			const srcAddr = `${raw[12]}.${raw[13]}.${raw[14]}.${raw[15]}`
			const dstAddr = `${raw[16]}.${raw[17]}.${raw[18]}.${raw[19]}`
			const protocol = raw[9]

			if (protocol !== 17) return null

			const udpOffset = ipHeaderLen
			const srcPort = raw.readUInt16BE(udpOffset)
			const dstPort = raw.readUInt16BE(udpOffset + 2)

			if (dstPort !== 53) return null

			const udpPayloadOffset = udpOffset + 8
			const data = raw.subarray(udpPayloadOffset)

			return {
				srcAddr,
				dstAddr,
				srcPort,
				dstPort,
				protocol,
				data: Buffer.from(data),
				timestamp: Date.now(),
			}
		} catch {
			return null
		}
	}

	reinjectPacket(packet: DnsPacket): void {
		this.stats.packetsReinjected++
	}

	dropPacket(): void {
		this.stats.packetsDropped++
	}

	getStats(): InterceptionStats {
		return { ...this.stats }
	}

	isRunning(): boolean {
		return this.running
	}
}
