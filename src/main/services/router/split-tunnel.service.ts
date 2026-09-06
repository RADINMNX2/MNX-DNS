import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { userLogger } from '../../shared/logger'
import type {
	DomainRule,
	BypassDomain,
	RoutingDecision,
	RoutingTable,
} from './types'
import { GameCategory } from './types'
import { parseBypassDomains, matchesDomain } from './domain-parser'
import { findMatchingCidr, isPrivateIp, parseCidrList } from './cidr-matcher'

const GAME_SERVER_CIDRS: string[] = [
	'155.133.0.0/17',
	'162.254.192.0/21',
	'185.25.180.0/22',
	'192.69.96.0/22',
]

export class SplitTunnelService {
	private routingTable: RoutingTable = {
		domains: new Map(),
		cidrs: [],
		gameServers: new Map(),
		totalRules: 0,
		lastUpdated: 0,
	}
	private bypassDomains: BypassDomain[] = []
	private active = false

	constructor() {}

	async initialize(): Promise<void> {
		userLogger.info('Initializing Split-Tunnel Service...')

		await this.loadBypassDomains()
		this.loadGameServerCidrs()
		this.buildRoutingTable()

		this.active = true
		userLogger.info(
			`Split-Tunnel ready: ${this.routingTable.totalRules} rules loaded`
		)
	}

	private async loadBypassDomains(): Promise<void> {
		try {
			const domainsPath = this.getDomainsPath()
			const { existsSync } = await import('node:fs')

			if (existsSync(domainsPath)) {
				const content = readFileSync(domainsPath, 'utf-8')
				const lines = content.split('\n')
				this.bypassDomains = parseBypassDomains(lines)
				userLogger.info(
					`Loaded ${this.bypassDomains.length} bypass domains`
				)
			} else {
				userLogger.warn(
					`Domains file not found at ${domainsPath}, using empty list`
				)
				this.bypassDomains = []
			}
		} catch (error: any) {
			userLogger.error('Failed to load bypass domains:', error?.message)
			this.bypassDomains = []
		}
	}

	private getDomainsPath(): string {
		if (app.isPackaged) {
			return join(process.resourcesPath, 'data', 'domains.txt')
		}
		return join(
			__dirname,
			'..',
			'..',
			'..',
			'..',
			'..',
			'..',
			'..',
			'data',
			'domains.txt'
		)
	}

	private loadGameServerCidrs(): void {
		this.routingTable.cidrs = parseCidrList(GAME_SERVER_CIDRS)
	}

	private buildRoutingTable(): void {
		this.routingTable.domains.clear()
		this.routingTable.gameServers.clear()

		for (const bd of this.bypassDomains) {
			const rule: DomainRule = {
				domain: bd.domain,
				action: bd.category !== 'general' ? 'tunnel' : 'bypass',
			}
			this.routingTable.domains.set(bd.domain, rule)

			if (bd.category !== 'general') {
				this.routingTable.gameServers.set(
					bd.domain,
					bd.category as GameCategory
				)
			}
		}

		this.routingTable.totalRules =
			this.routingTable.domains.size + this.routingTable.cidrs.length
		this.routingTable.lastUpdated = Date.now()
	}

	decide(host: string, remoteIp?: string): RoutingDecision {
		if (!this.active) {
			return {
				shouldIntercept: false,
				shouldTunnel: false,
				shouldBypass: true,
				confidence: 0,
			}
		}

		for (const [domain, rule] of this.routingTable.domains) {
			if (matchesDomain(host, domain)) {
				return {
					shouldIntercept: rule.action === 'intercept',
					shouldTunnel: rule.action === 'tunnel',
					shouldBypass: rule.action === 'bypass',
					matchedRule: rule,
					confidence: 1.0,
				}
			}
		}

		if (remoteIp && !isPrivateIp(remoteIp)) {
			const cidrMatch = findMatchingCidr(
				remoteIp,
				this.routingTable.cidrs
			)
			if (cidrMatch) {
				return {
					shouldIntercept: false,
					shouldTunnel: cidrMatch.action === 'tunnel',
					shouldBypass: cidrMatch.action === 'bypass',
					matchedRule: cidrMatch,
					confidence: 0.9,
				}
			}
		}

		return {
			shouldIntercept: false,
			shouldTunnel: false,
			shouldBypass: true,
			confidence: 0.5,
		}
	}

	getGameServers(): Map<string, GameCategory> {
		return new Map(this.routingTable.gameServers)
	}

	getStats(): {
		totalDomains: number
		totalGameServers: number
		totalCidrs: number
		totalRules: number
		lastUpdated: number
	} {
		return {
			totalDomains: this.routingTable.domains.size,
			totalGameServers: this.routingTable.gameServers.size,
			totalCidrs: this.routingTable.cidrs.length,
			totalRules: this.routingTable.totalRules,
			lastUpdated: this.routingTable.lastUpdated,
		}
	}

	isActive(): boolean {
		return this.active
	}

	shutdown(): void {
		this.active = false
		this.routingTable.domains.clear()
		this.routingTable.cidrs = []
		this.routingTable.gameServers.clear()
		userLogger.info('Split-Tunnel Service shut down')
	}
}
