import { spawn, ChildProcess, execSync } from 'node:child_process'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { app } from 'electron'
import { userLogger } from '../../shared/logger'

export type AetherProtocol = 'masque' | 'wg' | 'gool'
export type AetherScanMode = 'turbo' | 'balanced' | 'thorough' | 'stealth' | 'ironclad'
export type AetherNoize = 'off' | 'light' | 'firewall' | 'balanced' | 'gfw' | 'aggressive'

export interface AetherConfig {
	protocol: AetherProtocol
	bind: string
	scanMode: AetherScanMode
	noize: AetherNoize
	logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace'
	routesFile?: string
	peer?: string
	h2: boolean
	fragment: boolean
	dnsResolvers: string[]
}

export interface AetherStatus {
	running: boolean
	pid: number | null
	protocol: AetherProtocol
	bindAddress: string
	uptime: number
	lastError: string | null
	bytesReceived: number
	bytesSent: number
}

const DEFAULT_CONFIG: AetherConfig = {
	protocol: 'masque',
	bind: '127.0.0.1:1819',
	scanMode: 'turbo',
	noize: 'firewall',
	logLevel: 'error',
	h2: false,
	fragment: false,
	dnsResolvers: ['1.1.1.1', '1.0.0.1'],
}

export class AetherService {
	private process: ChildProcess | null = null
	private config: AetherConfig = { ...DEFAULT_CONFIG }
	private status: AetherStatus = {
		running: false,
		pid: null,
		protocol: 'masque',
		bindAddress: '127.0.0.1:1819',
		uptime: 0,
		lastError: null,
		bytesReceived: 0,
		bytesSent: 0,
	}
	private startTime = 0
	private stdoutBuffer = ''
	private stderrBuffer = ''
	private healthCheckInterval: NodeJS.Timeout | null = null
	private onStatusChange: ((status: AetherStatus) => void) | null = null

	constructor() {}

	getBinaryPath(): string {
		if (app.isPackaged) {
			return join(process.resourcesPath, 'binaries', 'aether', 'aether.exe')
		}
		return join(__dirname, '..', '..', '..', '..', '..', 'binaries', 'aether', 'aether.exe')
	}

	getRoutesPath(): string {
		if (app.isPackaged) {
			return join(process.resourcesPath, 'binaries', 'aether', 'routes.conf')
		}
		return join(__dirname, '..', '..', '..', '..', '..', 'binaries', 'aether', 'routes.conf')
	}

	getConfigPath(): string {
		if (app.isPackaged) {
			return join(process.resourcesPath, 'binaries', 'aether', 'aether.toml')
		}
		return join(__dirname, '..', '..', '..', '..', '..', 'binaries', 'aether', 'aether.toml')
	}

	validateBinaries(): boolean {
		const binPath = this.getBinaryPath()
		if (!existsSync(binPath)) {
			userLogger.error(`Aether binary not found at: ${binPath}`)
			return false
		}
		return true
	}

	setStatusChangeCallback(cb: (status: AetherStatus) => void): void {
		this.onStatusChange = cb
	}

	private emitStatusChange(): void {
		this.status.uptime = this.startTime > 0 ? Date.now() - this.startTime : 0
		this.onStatusChange?.(this.status)
	}

	async start(config?: Partial<AetherConfig>): Promise<void> {
		if (this.process) {
			userLogger.warn('Aether already running, stopping first...')
			await this.stop()
		}

		if (config) {
			this.config = { ...DEFAULT_CONFIG, ...config }
		}

		const binPath = this.getBinaryPath()
		if (!existsSync(binPath)) {
			throw new Error(`Aether binary not found: ${binPath}`)
		}

		const args = this.buildArgs()
		userLogger.info(`Starting Aether: ${binPath} ${args.join(' ')}`)

		return new Promise((resolve, reject) => {
			try {
				this.process = spawn(binPath, args, {
					stdio: ['pipe', 'pipe', 'pipe'],
					windowsHide: true,
					env: {
						...process.env,
						RUST_LOG: this.config.logLevel,
					},
				})

				this.startTime = Date.now()
				this.status.running = true
				this.status.pid = this.process.pid ?? null
				this.status.protocol = this.config.protocol
				this.status.bindAddress = this.config.bind
				this.status.lastError = null

				this.process.stdout?.on('data', (data: Buffer) => {
					const line = data.toString()
					this.stdoutBuffer += line
					userLogger.debug(`[Aether stdout] ${line.trim()}`)
					this.parseOutput(line)
				})

				this.process.stderr?.on('data', (data: Buffer) => {
					const line = data.toString()
					this.stderrBuffer += line
					userLogger.debug(`[Aether stderr] ${line.trim()}`)
				})

				this.process.on('error', (error) => {
					userLogger.error('Aether process error:', error.message)
					this.status.running = false
					this.status.lastError = error.message
					this.emitStatusChange()
					reject(error)
				})

				this.process.on('close', (code) => {
					userLogger.info(`Aether process exited with code ${code}`)
					this.process = null
					this.status.running = false
					this.status.pid = null
					this.stopHealthCheck()
					this.emitStatusChange()
				})

				this.startHealthCheck()
				this.emitStatusChange()

				setTimeout(() => {
					if (this.process && this.process.exitCode === null) {
						userLogger.info('Aether started successfully (process alive)')
						resolve()
					}
				}, 2000)
			} catch (error: any) {
				this.status.running = false
				this.status.lastError = error?.message
				this.emitStatusChange()
				reject(error)
			}
		})
	}

	private buildArgs(): string[] {
		const args: string[] = []

		args.push('--bind', this.config.bind)
		args.push(`--${this.config.protocol}`)
		args.push('--scan', this.config.scanMode)
		args.push('--noize', this.config.noize)
		args.push('--log-level', this.config.logLevel)
		args.push('-4')

		if (this.config.routesFile && existsSync(this.config.routesFile)) {
			args.push('--routes', this.config.routesFile)
		}

		if (this.config.peer) {
			args.push('--peer', this.config.peer)
		}

		if (this.config.h2) {
			args.push('--h2')
		}

		if (this.config.fragment) {
			args.push('--fragment')
		}

		if (this.config.dnsResolvers.length > 0) {
			args.push('--dns', this.config.dnsResolvers.join(','))
		}

		return args
	}

	private parseOutput(line: string): void {
		if (line.includes('SOCKS5 listening on') || line.includes('listening on')) {
			userLogger.info('Aether SOCKS5 proxy is ready')
		}
		if (line.includes('connected') || line.includes('tunnel established')) {
			userLogger.info('Aether tunnel established')
		}
		if (line.includes('error') || line.includes('Error')) {
			this.status.lastError = line.trim()
		}
	}

	private startHealthCheck(): void {
		this.stopHealthCheck()
		this.healthCheckInterval = setInterval(() => {
			this.checkHealth()
		}, 5000)
	}

	private stopHealthCheck(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval)
			this.healthCheckInterval = null
		}
	}

	private checkHealth(): void {
		if (!this.process || this.process.exitCode !== null) {
			if (this.status.running) {
				this.status.running = false
				this.status.lastError = 'Process exited unexpectedly'
				this.emitStatusChange()
			}
			return
		}

		const [host, port] = this.config.bind.split(':')
		try {
			const result = execSync(
				`netstat -an | findstr "${port}" | findstr "LISTENING"`,
				{ timeout: 3000, windowsHide: true }
			)
			const listening = result.toString().includes(port)
			if (!listening) {
				userLogger.warn('Aether port not listening yet')
			}
		} catch {
			// netstat findstr returns non-zero if no match
		}
	}

	async stop(): Promise<void> {
		this.stopHealthCheck()

		if (!this.process) {
			this.status.running = false
			this.status.pid = null
			this.emitStatusChange()
			return
		}

		userLogger.info('Stopping Aether...')

		return new Promise((resolve) => {
			const proc = this.process!
			const forceKillTimeout = setTimeout(() => {
				try {
					proc.kill('SIGKILL')
				} catch {}
			}, 5000)

			proc.on('close', () => {
				clearTimeout(forceKillTimeout)
				this.process = null
				this.status.running = false
				this.status.pid = null
				this.startTime = 0
				this.emitStatusChange()
				userLogger.info('Aether stopped')
				resolve()
			})

			try {
				proc.kill('SIGTERM')
			} catch {
				try {
					proc.kill()
				} catch {}
			}
		})
	}

	getStatus(): AetherStatus {
		this.status.uptime = this.startTime > 0 ? Date.now() - this.startTime : 0
		return { ...this.status }
	}

	isRunning(): boolean {
		return this.process !== null && this.process.exitCode === null
	}

	getConfig(): AetherConfig {
		return { ...this.config }
	}

	async updateConfig(patch: Partial<AetherConfig>): Promise<void> {
		this.config = { ...this.config, ...patch }
		if (this.isRunning()) {
			userLogger.info('Config updated, restarting Aether...')
			await this.stop()
			await this.start(this.config)
		}
	}
}
