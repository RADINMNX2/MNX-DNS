import { join } from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { app } from 'electron'
import { userLogger } from '../../shared/logger'
import type {
	WireGuardConfig,
	WireGuardStatus,
	TunnelNode,
	SplitTunnelConfig,
} from './types'

const execAsync = promisify(exec)

export class WireGuardService {
	private config: WireGuardConfig | null = null
	private status: WireGuardStatus = {
		connected: false,
		interfaceName: 'MNX-Tunnel',
		bytesReceived: 0,
		bytesSent: 0,
		latestHandshake: null,
		transferRate: { rx: 0, tx: 0 },
	}
	private statsInterval: NodeJS.Timeout | null = null
	private splitConfig: SplitTunnelConfig = {
		enabled: false,
		bypassDomains: [],
		gatewayCidrs: [],
		excludeApps: [],
	}

	constructor() {}

	getBinariesPath(): string {
		if (app.isPackaged) {
			return join(process.resourcesPath, 'binaries', 'wireguard')
		}
		return join(__dirname, '..', '..', '..', '..', 'binaries', 'wireguard')
	}

	async connect(config: WireGuardConfig): Promise<void> {
		if (this.status.connected) {
			userLogger.warn('WireGuard already connected, disconnecting first')
			await this.disconnect()
		}

		this.config = config
		userLogger.info(
			`Connecting WireGuard tunnel to ${config.peer.endpoint}`
		)

		try {
			const wgPath = this.getWintunPath()
			await this.applyConfig(config)
			await this.startInterface(config)
			this.status.connected = true
			this.startStatsPolling()
			userLogger.info('WireGuard tunnel connected')
		} catch (error: any) {
			userLogger.error('WireGuard connection failed:', error?.message)
			throw error
		}
	}

	private getWintunPath(): string {
		return join(this.getBinariesPath(), 'wintun.dll')
	}

	private async applyConfig(config: WireGuardConfig): Promise<void> {
		const confContent = this.generateConfigFile(config)
		userLogger.debug('Generated WireGuard config:', confContent)
		// Config will be written to temp and applied via wg-quick or manual netsh
	}

	private generateConfigFile(config: WireGuardConfig): string {
		const sections: string[] = [
			'[Interface]',
			`PrivateKey = ${config.privateKey}`,
			`Address = ${config.address}`,
			`DNS = ${config.dns.join(', ')}`,
		]

		if (config.mtu) sections.push(`MTU = ${config.mtu}`)

		sections.push('')
		sections.push('[Peer]')
		sections.push(`PublicKey = ${config.peer.publicKey}`)
		sections.push(`Endpoint = ${config.peer.endpoint}`)
		sections.push(
			`AllowedIPs = ${config.peer.allowedIPs.join(', ')}`
		)

		if (config.peer.persistentKeepalive) {
			sections.push(
				`PersistentKeepalive = ${config.peer.persistentKeepalive}`
			)
		}

		if (config.preSharedKey) {
			sections.push(`PresharedKey = ${config.preSharedKey}`)
		}

		return sections.join('\n')
	}

	private async startInterface(config: WireGuardConfig): Promise<void> {
		// WireGuard interface creation via wg.exe or netsh
		userLogger.info(
			`Starting WireGuard interface: ${this.status.interfaceName}`
		)
	}

	async disconnect(): Promise<void> {
		if (!this.status.connected) return

		userLogger.info('Disconnecting WireGuard tunnel...')
		this.stopStatsPolling()

		try {
			// Tear down the tunnel interface
			await this.teardownInterface()
			this.status.connected = false
			this.status.bytesReceived = 0
			this.status.bytesSent = 0
			this.status.latestHandshake = null
			userLogger.info('WireGuard tunnel disconnected')
		} catch (error: any) {
			userLogger.error('WireGuard disconnect error:', error?.message)
		}
	}

	private async teardownInterface(): Promise<void> {
		userLogger.info(
			`Tearing down interface: ${this.status.interfaceName}`
		)
	}

	getStatus(): WireGuardStatus {
		return { ...this.status }
	}

	isConnected(): boolean {
		return this.status.connected
	}

	setSplitTunnelConfig(config: SplitTunnelConfig): void {
		this.splitConfig = config
		userLogger.info(
			`Split tunnel config updated: ${config.bypassDomains.length} bypass domains, ${config.gatewayCidrs.length} CIDRs`
		)
	}

	getSplitTunnelConfig(): SplitTunnelConfig {
		return { ...this.splitConfig }
	}

	private startStatsPolling(): void {
		this.statsInterval = setInterval(() => {
			this.pollStats()
		}, 2000)
	}

	private stopStatsPolling(): void {
		if (this.statsInterval) {
			clearInterval(this.statsInterval)
			this.statsInterval = null
		}
	}

	private async pollStats(): Promise<void> {
		// Read handshake and transfer stats from wg show
	}

	async selectNode(node: TunnelNode): Promise<void> {
		userLogger.info(
			`Selecting tunnel node: ${node.name} (${node.region})`
		)

		const config: WireGuardConfig = {
			privateKey: '', // Will be generated or provided
			address: '10.0.0.2/32',
			dns: ['1.1.1.1', '8.8.8.8'],
			peer: {
				publicKey: node.publicKey,
				allowedIPs: ['0.0.0.0/0'],
				endpoint: `${node.endpoint}:51820`,
				persistentKeepalive: 25,
			},
			mtu: 1280,
		}

		await this.connect(config)
	}
}
