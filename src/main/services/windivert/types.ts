export interface WinDivertConfig {
	filter: string
	layer: WinDivertLayer
	priority: number
	flags: number
}

export enum WinDivertLayer {
	WINDIVERT_LAYER_NETWORK = 0,
	WINDIVERT_LAYER_NETWORK_FORWARD = 1,
	WINDIVERT_LAYER_FLOW = 2,
	WINDIVERT_LAYER_SOCKET = 3,
	WINDIVERT_LAYER反射 = 4,
}

export enum WinDivertFlag {
	WINDIVERT_FLAG_SNIFF = 0x001,
	WINDIVERT_FLAG_DROP = 0x002,
	WINDIVERT_FLAG_RECV_ONLY = 0x004,
	WINDIVERT_FLAG_SEND_ONLY = 0x008,
}

export interface DnsPacket {
	srcAddr: string
	dstAddr: string
	srcPort: number
	dstPort: number
	protocol: number
	data: Buffer
	timestamp: number
}

export interface WinDivertAddress {
	Layer: number
	SubLayer: number
	Flags: number
	Timestamp: number
	NetworkIPv4: { InterfaceId: number; SubInterfaceId: number; Reserved: number }
}

export interface InterceptionStats {
	packetsCaptured: number
	packetsReinjected: number
	packetsDropped: number
	dnsQueriesIntercepted: number
	startTime: number
	lastActivity: number
}
