export interface DomainRule {
	domain: string
	action: 'tunnel' | 'bypass' | 'intercept'
	pattern?: RegExp
}

export interface CidrRule {
	cidr: string
	action: 'tunnel' | 'bypass'
}

export interface BypassDomain {
	domain: string
	category: GameCategory | 'general'
}

export enum GameCategory {
	SHOOTER = 'shooter',
	MOBA = 'moba',
	BATTLE_ROYALE = 'battle_royale',
	FIGHTING = 'fighting',
	RACING = 'racing',
	SURVIVAL = 'survival',
	RPG = 'rpg',
	STRATEGY = 'strategy',
	PLATFORM = 'platform',
	SIMULATION = 'simulation',
}

export interface RoutingDecision {
	shouldIntercept: boolean
	shouldTunnel: boolean
	shouldBypass: boolean
	matchedRule?: DomainRule | CidrRule
	confidence: number
}

export interface RoutingTable {
	domains: Map<string, DomainRule>
	cidrs: CidrRule[]
	gameServers: Map<string, GameCategory>
	totalRules: number
	lastUpdated: number
}
