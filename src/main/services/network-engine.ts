import { app } from 'electron'
import { userLogger } from '../shared/logger'
import { WinDivertService } from './windivert/windivert.service'
import { WireGuardService } from './wireguard/wireguard.service'
import { SplitTunnelService } from './router/split-tunnel.service'
import type { DnsPacket } from './windivert/types'
import type { WireGuardConfig, TunnelNode, SplitTunnelConfig } from './wireguard/types'

export class NetworkEngine {
	private windivert: WinDivertService
	private wireguard: WireGuardService
	private splitTunnel: SplitTunnelService
	private initialized = false

	constructor() {
		this.windivert = new WinDivertService()
		this.wireguard = new WireGuardService()
		this.splitTunnel = new SplitTunnelService()
	}

	async initialize(): Promise<void> {
		if (this.initialized) return

		userLogger.info('Initializing MNX Network Engine...')

		try {
			await this.splitTunnel.initialize()

			this.windivert.onDnsPacket((packet: DnsPacket) => {
				return this.handleDnsPacket(packet)
			})

			this.initialized = true
			userLogger.info('MNX Network Engine initialized successfully')
		} catch (error: any) {
			userLogger.error(
				'Network Engine initialization failed:',
				error?.message
			)
			throw error
		}
	}

	private handleDnsPacket(packet: DnsPacket): DnsPacket | null {
		const decision = this.splitTunnel.decide(packet.dstAddr)

		if (decision.shouldBypass) {
			return packet
		}

		if (decision.shouldTunnel && this.wireguard.isConnected()) {
			return packet
		}

		return packet
	}

	async startInterception(): Promise<void> {
		if (!this.initialized) await this.initialize()

		if (process.platform === 'win32') {
			await this.windivert.start()
		}
	}

	async stopInterception(): Promise<void> {
		await this.windivert.stop()
	}

	async connectTunnel(node: TunnelNode): Promise<void> {
		await this.wireguard.selectNode(node)
	}

	async disconnectTunnel(): Promise<void> {
		await this.wireguard.disconnect()
	}

	updateSplitTunnelConfig(config: SplitTunnelConfig): void {
		this.wireguard.setSplitTunnelConfig(config)
	}

	getEngineStatus(): {
		windivert: boolean
		wireguard: boolean
		splitTunnel: boolean
		stats: ReturnType<WinDivertService['getStats']>
	} {
		return {
			windivert: this.windivert.isRunning(),
			wireguard: this.wireguard.isConnected(),
			splitTunnel: this.splitTunnel.isActive(),
			stats: this.windivert.getStats(),
		}
	}

	getGameServers() {
		return this.splitTunnel.getGameServers()
	}

	getSplitTunnelStats() {
		return this.splitTunnel.getStats()
	}

	async shutdown(): Promise<void> {
		await this.windivert.stop()
		await this.wireguard.disconnect()
		this.splitTunnel.shutdown()
		this.initialized = false
		userLogger.info('Network Engine shut down')
	}
}

let engineInstance: NetworkEngine | null = null

export function getNetworkEngine(): NetworkEngine {
	if (!engineInstance) {
		engineInstance = new NetworkEngine()
	}
	return engineInstance
}
