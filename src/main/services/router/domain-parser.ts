import type { DomainRule, BypassDomain } from './types'
import { GameCategory } from './types'

export function parseBypassDomains(rawLines: string[]): BypassDomain[] {
	const domains: BypassDomain[] = []

	for (const line of rawLines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue

		const domain = trimmed.toLowerCase()
		const category = classifyDomain(domain)

		domains.push({ domain, category })
	}

	return domains
}

function classifyDomain(domain: string): GameCategory | 'general' {
	const gamePatterns: [RegExp, GameCategory][] = [
		[/cs2|counter.?strike|valve|steam/gi, GameCategory.SHOOTER],
		[/valorant|riot/gi, GameCategory.SHOOTER],
		[/fortnite|epic/gi, GameCategory.BATTLE_ROYALE],
		[/pubg|krafton/gi, GameCategory.BATTLE_ROYALE],
		[/apex/gi, GameCategory.BATTLE_ROYALE],
		[/dota|league|lol|riot/gi, GameCategory.MOBA],
		[/tekken|street.?fighter|fighting/gi, GameCategory.FIGHTING],
		[/forza|assetto|racing/gi, GameCategory.RACING],
		[/rust|dayz|scum|survival/gi, GameCategory.SURVIVAL],
		[/elden|diablo|genshin|rpg/gi, GameCategory.RPG],
		[/arma|strategy|total.?war/gi, GameCategory.STRATEGY],
		[/minecraft|terraria|roblox/gi, GameCategory.PLATFORM],
		[/euro.?truck|simulator/gi, GameCategory.SIMULATION],
	]

	for (const [pattern, category] of gamePatterns) {
		if (pattern.test(domain)) return category
	}

	return 'general'
}

export function domainToRegex(domain: string): RegExp {
	const escaped = domain
		.replace(/\./g, '\\.')
		.replace(/\*/g, '.*')
		.replace(/\?/g, '.')
	return new RegExp(`^${escaped}$`, 'i')
}

export function matchesDomain(
	host: string,
	domain: string
): boolean {
	if (domain.startsWith('*.')) {
		const suffix = domain.slice(1)
		return host === suffix || host.endsWith(suffix)
	}
	return host === domain
}
