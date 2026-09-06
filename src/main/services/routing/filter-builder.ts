import type { ProfileState } from './routing-dispatcher'

export class WinDivertFilterBuilder {
	buildFilter(profiles: ProfileState[]): string {
		const gameProfiles = profiles.filter((p) => p.tier === 'game_fastpath')
		const voiceProfiles = profiles.filter((p) => p.tier === 'voice_tunnel')
		const mediaProfiles = profiles.filter((p) => p.tier === 'media_bypass')

		const parts: string[] = []

		if (gameProfiles.length > 0) {
			parts.push(this.buildGameFilter(gameProfiles))
		}

		if (voiceProfiles.length > 0) {
			parts.push(this.buildVoiceFilter(voiceProfiles))
		}

		if (mediaProfiles.length > 0) {
			parts.push(this.buildMediaFilter(mediaProfiles))
		}

		if (parts.length === 0) {
			return 'udp.DstPort == 53 and (ip or ipv6) and not loopback'
		}

		return parts.join(' or ')
	}

	private buildGameFilter(profiles: ProfileState[]): string {
		const gamePorts = 'udp.DstPort == 27015 or udp.DstPort == 27036 or udp.DstPort == 3478 or udp.DstPort == 3074 or udp.DstPort == 3480 or udp.DstPort == 1935 or udp.DstPort == 4380 or udp.DstPort == 27000 or udp.DstPort == 27031'

		const dnsBypass = profiles.some((p) => p.mode === 'dns_only')
			? ' or udp.DstPort == 53'
			: ''

		return `(${gamePorts}${dnsBypass}) and ip`
	}

	private buildVoiceFilter(profiles: ProfileState[]): string {
		return `(udp.DstPort == 50000 or udp.DstPort == 50001 or udp.DstPort == 50002 or udp.DstPort == 50003 or udp.DstPort == 50004 or udp.DstPort == 50005) and ip`
	}

	private buildMediaFilter(profiles: ProfileState[]): string {
		return `udp.DstPort == 53 and (ip or ipv6) and not loopback`
	}

	buildInlineBlockList(): string {
		const blockedPorts = [
			'port:25',
			'port:587',
			'port:465',
			'port:143',
			'port:993',
		]
		return blockedPorts.join(',')
	}

	buildInlineDirectList(): string {
		const directEntries = [
			'private',
			'127.0.0.0/8',
			'10.0.0.0/8',
			'172.16.0.0/12',
			'192.168.0.0/16',
			'169.254.0.0/16',
		]
		return directEntries.join(',')
	}
}
