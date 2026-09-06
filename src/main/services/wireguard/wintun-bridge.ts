import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { app } from 'electron'
import { userLogger } from '../../shared/logger'
import type { WireGuardConfig, WireGuardStatus } from './types'

const execAsync = promisify(exec)

export class WintunBridge {
	private interfaceName = 'MNX-Tunnel'
	private adapterGuid: string | null = null
	private monitoringInterval: NodeJS.Timeout | null = null

	constructor(private service: string) {}

	getWintunPath(): string {
		const basePath = app.isPackaged
			? join(process.resourcesPath, 'binaries', 'wireguard')
			: join(__dirname, '..', '..', '..', '..', 'binaries', 'wireguard')
		return join(basePath, 'wintun.dll')
	}

	getWgPath(): string {
		const basePath = app.isPackaged
			? join(process.resourcesPath, 'binaries', 'wireguard')
			: join(__dirname, '..', '..', '..', '..', 'binaries', 'wireguard')
		return join(basePath, 'wg.exe')
	}

	getWgQuickPath(): string {
		const basePath = app.isPackaged
			? join(process.resourcesPath, 'binaries', 'wireguard')
			: join(__dirname, '..', '..', '..', '..', 'binaries', 'wireguard')
		return join(basePath, 'wg-quick.exe')
	}

	async validateBinaries(): Promise<boolean> {
		const wintunPath = this.getWintunPath()
		const wgPath = this.getWgPath()

		if (!existsSync(wintunPath)) {
			userLogger.error(`wintun.dll not found at: ${wintunPath}`)
			return false
		}
		if (!existsSync(wgPath)) {
			userLogger.error(`wg.exe not found at: ${wgPath}`)
			return false
		}
		return true
	}

	async createInterface(config: WireGuardConfig): Promise<void> {
		userLogger.info(
			`Creating WireGuard interface: ${this.interfaceName}`
		)

		const confContent = this.buildConfigFile(config)
		const confPath = this.getTempConfigPath()

		const { writeFileSync } = await import('node:fs')
		writeFileSync(confPath, confContent, 'utf-8')

		try {
			await execAsync(
				`"${this.getWgPath()}" /install "${confPath}"`,
				{ timeout: 30000 }
			)
			userLogger.info(
				`WireGuard interface "${this.interfaceName}" created`
			)
		} catch (error: any) {
			userLogger.error(
				`Failed to create WireGuard interface: ${error?.message}`
			)
			throw error
		}
	}

	private buildConfigFile(config: WireGuardConfig): string {
		const lines: string[] = [
			'[Interface]',
			`PrivateKey = ${config.privateKey}`,
			`Address = ${config.address}`,
			`DNS = ${config.dns.join(', ')}`,
		]

		if (config.mtu) lines.push(`MTU = ${config.mtu}`)

		lines.push('')
		lines.push('[Peer]')
		lines.push(`PublicKey = ${config.peer.publicKey}`)
		lines.push(`Endpoint = ${config.peer.endpoint}`)
		lines.push(
			`AllowedIPs = ${config.peer.allowedIPs.join(', ')}`
		)

		if (config.peer.persistentKeepalive) {
			lines.push(
				`PersistentKeepalive = ${config.peer.persistentKeepalive}`
			)
		}

		if (config.preSharedKey) {
			lines.push(`PresharedKey = ${config.preSharedKey}`)
		}

		return lines.join('\n')
	}

	private getTempConfigPath(): string {
		return join(
			app.getPath('temp'),
			`mnx-wg-${Date.now()}.conf`
		)
	}

	async destroyInterface(): Promise<void> {
		userLogger.info(
			`Destroying WireGuard interface: ${this.interfaceName}`
		)

		try {
			await execAsync(
				`"${this.getWgPath()}" /uninstall`,
				{ timeout: 15000 }
			)
			this.adapterGuid = null
			userLogger.info(
				`WireGuard interface "${this.interfaceName}" destroyed`
			)
		} catch (error: any) {
			userLogger.error(
				`Failed to destroy WireGuard interface: ${error?.message}`
			)
		}
	}

	async getStatus(): Promise<{
		connected: boolean
		bytesReceived: number
		bytesSent: number
		latestHandshake: number | null
	}> {
		try {
			const { stdout } = await execAsync(
				`"${this.getWgPath()}" show ${this.interfaceName} transfer`,
				{ timeout: 5000 }
			}

			const lines = stdout.trim().split('\n')
			if (lines.length > 0) {
				const parts = lines[lines.length - 1].split('\t')
				if (parts.length >= 2) {
					return {
						connected: true,
						bytesReceived: parseInt(parts[0]) || 0,
						bytesSent: parseInt(parts[1]) || 0,
						latestHandshake: Date.now(),
					}
				}
			}
		} catch {
			// Interface may not exist
		}

		return {
			connected: false,
			bytesReceived: 0,
			bytesSent: 0,
			latestHandshake: null,
		}
	}

	startMonitoring(
		onUpdate: (status: {
			bytesReceived: number
			bytesSent: number
		}) => void,
		intervalMs = 2000
	): void {
		this.stopMonitoring()

		let prevRx = 0
		let prevTx = 0

		this.monitoringInterval = setInterval(async () => {
			const status = await this.getStatus()
			if (status.connected) {
				const rxDelta = status.bytesReceived - prevRx
				const txDelta = status.bytesSent - prevTx
				prevRx = status.bytesReceived
				prevTx = status.bytesSent
				onUpdate({ bytesReceived: rxDelta, bytesSent: txDelta })
			}
		}, intervalMs)
	}

	stopMonitoring(): void {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval)
			this.monitoringInterval = null
		}
	}
}
