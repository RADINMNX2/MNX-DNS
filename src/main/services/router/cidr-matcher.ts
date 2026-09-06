import type { CidrRule } from './types'

function ipToInt(ip: string): number {
	const parts = ip.split('.').map(Number)
	if (parts.length !== 4) return 0
	return (
		((parts[0] << 24) |
			(parts[1] << 16) |
			(parts[2] << 8) |
			parts[3]) >>>
		0
	)
}

function intToIp(int: number): string {
	return [
		(int >>> 24) & 0xff,
		(int >>> 16) & 0xff,
		(int >>> 8) & 0xff,
		int & 0xff,
	].join('.')
}

function cidrToRange(
	cidr: string
): { start: number; end: number } | null {
	const [ipStr, prefixStr] = cidr.split('/')
	const prefix = Number(prefixStr)

	if (!ipStr || isNaN(prefix) || prefix < 0 || prefix > 32) return null

	const ip = ipToInt(ipStr)
	if (ip === 0) return null

	const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
	const start = (ip & mask) >>> 0
	const end = (start | (~mask >>> 0)) >>> 0

	return { start, end }
}

export function ipMatchesCidr(ip: string, cidr: string): boolean {
	const range = cidrToRange(cidr)
	if (!range) return false

	const ipInt = ipToInt(ip)
	return ipInt >= range.start && ipInt <= range.end
}

export function findMatchingCidr(
	ip: string,
	rules: CidrRule[]
): CidrRule | null {
	const ipInt = ipToInt(ip)

	for (const rule of rules) {
		const range = cidrToRange(rule.cidr)
		if (!range) continue

		if (ipInt >= range.start && ipInt <= range.end) {
			return rule
		}
	}

	return null
}

export function isPrivateIp(ip: string): boolean {
	const ranges = [
		'10.0.0.0/8',
		'172.16.0.0/12',
		'192.168.0.0/16',
		'127.0.0.0/8',
		'169.254.0.0/16',
	]

	return ranges.some((cidr) => ipMatchesCidr(ip, cidr))
}

export function parseCidrList(cidrs: string[]): CidrRule[] {
	return cidrs
		.map((cidr) => {
			const trimmed = cidr.trim()
			if (!trimmed.includes('/')) return null
			return { cidr: trimmed, action: 'tunnel' as const }
		})
		.filter((r): r is CidrRule => r !== null)
}
