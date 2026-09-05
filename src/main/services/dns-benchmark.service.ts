import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'

import type { Server } from '../../shared/interfaces/server.interface'
import type { DnsBenchmarkResult } from '../../shared/interfaces/dns-benchmark.interface'

const DEFAULT_TIMEOUT = 6000
const DEFAULT_CONCURRENCY = 6

interface ParsedTarget {
	hostname: string
	path: string
	isHttps: boolean
}

function parseTargetUrl(target: string): ParsedTarget {
	const normalized = /^https?:\/\//i.test(target) ? target : `https://${target}`

	const url = new URL(normalized)

	return {
		hostname: url.hostname,
		path: `${url.pathname}${url.search}` || '/',
		isHttps: url.protocol === 'https:',
	}
}

function resolveWithServer(
	nameServers: string[],
	hostname: string,
	timeout: number
): Promise<{ address: string; time: number }> {
	return new Promise((resolve, reject) => {
		const resolver = new dns.Resolver({ timeout })
		resolver.setServers(nameServers)

		const started = Date.now()

		const timer = setTimeout(() => {
			resolver.cancel()
			reject(new Error('DNS_TIMEOUT'))
		}, timeout)

		resolver.resolve4(hostname, (err, addresses) => {
			clearTimeout(timer)

			if (err) return reject(err)
			if (!addresses?.length) return reject(new Error('DNS_NO_ANSWER'))

			resolve({ address: addresses[0], time: Date.now() - started })
		})
	})
}

function requestThroughIp(
	ip: string,
	hostname: string,
	path: string,
	isHttps: boolean,
	timeout: number
): Promise<{ statusCode: number; time: number }> {
	return new Promise((resolve, reject) => {
		const started = Date.now()
		const client = isHttps ? https : http

		const req = client.request(
			{
				host: ip,
				port: isHttps ? 443 : 80,
				path,
				method: 'GET',
				headers: { Host: hostname, Connection: 'close' },
				servername: hostname,
				timeout,
				rejectUnauthorized: false,
			},
			(res) => {
				resolve({ statusCode: res.statusCode || 0, time: Date.now() - started })
				res.destroy()
			}
		)

		req.on('timeout', () => req.destroy(new Error('REQUEST_TIMEOUT')))
		req.on('error', reject)

		req.end()
	})
}

export async function benchmarkSingleServer(
	server: Server,
	targetUrl: string,
	timeout: number = DEFAULT_TIMEOUT
): Promise<DnsBenchmarkResult> {
	const base = { key: server.key, name: server.name }
	const nameServers = (server.servers || []).filter(Boolean)

	if (!nameServers.length) {
		return {
			...base,
			status: 'failed',
			ping: -1,
			statusCode: null,
			message: 'No DNS address',
		}
	}

	let hostname: string
	let path: string
	let isHttps: boolean

	try {
		;({ hostname, path, isHttps } = parseTargetUrl(targetUrl))
	} catch {
		return {
			...base,
			status: 'failed',
			ping: -1,
			statusCode: null,
			message: 'Invalid target URL',
		}
	}

	let resolved: { address: string; time: number }

	try {
		resolved = await resolveWithServer(nameServers, hostname, timeout)
	} catch {
		return {
			...base,
			status: 'failed',
			ping: -1,
			statusCode: null,
			message: 'DNS resolve failed',
		}
	}

	try {
		const response = await requestThroughIp(
			resolved.address,
			hostname,
			path,
			isHttps,
			timeout
		)
		const ping = resolved.time + response.time

		if (response.statusCode === 403) {
			return {
				...base,
				status: 'blocked',
				ping,
				statusCode: response.statusCode,
				message: 'Blocked (403 Forbidden)',
			}
		}

		if (response.statusCode >= 500 || response.statusCode === 0) {
			return {
				...base,
				status: 'error',
				ping,
				statusCode: response.statusCode,
				message: `Server error (${response.statusCode})`,
			}
		}

		return {
			...base,
			status: 'ok',
			ping,
			statusCode: response.statusCode,
			message: 'Reachable',
		}
	} catch {
		return {
			...base,
			status: 'failed',
			ping: resolved.time,
			statusCode: null,
			message: 'Request failed',
		}
	}
}

export async function benchmarkServers(
	servers: Server[],
	targetUrl: string,
	concurrency: number = DEFAULT_CONCURRENCY
): Promise<DnsBenchmarkResult[]> {
	const results: DnsBenchmarkResult[] = []
	const queue = [...servers]

	async function worker() {
		let server = queue.shift()

		while (server) {
			results.push(await benchmarkSingleServer(server, targetUrl))
			server = queue.shift()
		}
	}

	const workerCount = Math.max(1, Math.min(concurrency, servers.length))

	await Promise.all(Array.from({ length: workerCount }, () => worker()))

	results.sort((a, b) => {
		if (a.status === 'ok' && b.status !== 'ok') return -1
		if (a.status !== 'ok' && b.status === 'ok') return 1
		if (a.ping === -1) return 1
		if (b.ping === -1) return -1
		return a.ping - b.ping
	})

	return results
}
