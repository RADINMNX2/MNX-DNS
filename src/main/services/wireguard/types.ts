export interface WireGuardConfig {
	privateKey: string
	address: string
	dns: string[]
	peer: WireGuardPeer
	mtu?: number
	preSharedKey?: string
}

export interface WireGuardPeer {
	publicKey: string
	allowedIPs: string[]
	endpoint: string
	persistentKeepalive?: number
}

export interface WireGuardStatus {
	connected: boolean
	interfaceName: string
	bytesReceived: number
	bytesSent: number
	latestHandshake: number | null
	transferRate: { rx: number; tx: number }
}

export interface TunnelNode {
	id: string
	name: string
	region: string
	countryCode: string
	endpoint: string
	publicKey: string
	city?: string
	pingMs?: number
	load?: number
	maxPeers?: number
	isOnline: boolean
}

export interface SplitTunnelConfig {
	enabled: boolean
	bypassDomains: string[]
	gatewayCidrs: string[]
	excludeApps: string[]
}
