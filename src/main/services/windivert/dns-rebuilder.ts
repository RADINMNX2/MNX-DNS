import { userLogger } from '../../shared/logger'
import type { DnsPacket } from './types'

const DNS_HEADER_SIZE = 12
const DNS_OPCODE_MASK = 0x78
const DNS_RD_FLAG = 0x0100
const DNS_RA_FLAG = 0x8000
const DNS_RCODE_MASK = 0x000f

export interface DnsQuestion {
	name: string
	type: number
	class: number
}

export interface DnsAnswer {
	name: string
	type: number
	class: number
	ttl: number
	data: Buffer
}

export interface ParsedDnsMessage {
	id: number
	flags: number
	questions: DnsQuestion[]
	answers: DnsAnswer[]
	isResponse: boolean
	rcode: number
}

export class DnsRebuilder {
	private upstreamResolvers: string[] = [
		'1.1.1.1',
		'8.8.8.8',
		'1.0.0.1',
		'8.8.4.4',
		'9.9.9.9',
	]

	setUpstreamResolvers(resolvers: string[]): void {
		this.upstreamResolvers = resolvers
	}

	parseDnsMessage(data: Buffer): ParsedDnsMessage | null {
		if (data.length < DNS_HEADER_SIZE) return null

		try {
			const id = data.readUInt16BE(0)
			const flags = data.readUInt16BE(2)
			const qdcount = data.readUInt16BE(4)
			const ancount = data.readUInt16BE(6)

			const isResponse = (flags & 0x8000) !== 0
			const rcode = flags & DNS_RCODE_MASK

			let offset = DNS_HEADER_SIZE
			const questions: DnsQuestion[] = []

			for (let i = 0; i < qdcount && offset < data.length; i++) {
				const { name, newOffset } = this.parseDnsName(data, offset)
				if (newOffset === offset) break
				offset = newOffset

				if (offset + 4 > data.length) break

				const type = data.readUInt16BE(offset)
				const cls = data.readUInt16BE(offset + 2)
				offset += 4

				questions.push({ name, type, class: cls })
			}

			const answers: DnsAnswer[] = []
			for (let i = 0; i < ancount && offset < data.length; i++) {
				const { name, newOffset } = this.parseDnsName(data, offset)
				if (newOffset === offset) break
				offset = newOffset

				if (offset + 10 > data.length) break

				const type = data.readUInt16BE(offset)
				const cls = data.readUInt16BE(offset + 2)
				const ttl = data.readUInt32BE(offset + 4)
				const rdlength = data.readUInt16BE(offset + 8)
				offset += 10

				if (offset + rdlength > data.length) break
				const rdata = Buffer.from(data.subarray(offset, offset + rdlength))
				offset += rdlength

				answers.push({ name, type, class: cls, ttl, data: rdata })
			}

			return { id, flags, questions, answers, isResponse, rcode }
		} catch {
			return null
		}
	}

	private parseDnsName(
		buffer: Buffer,
		offset: number
	): { name: string; newOffset: number } {
		const labels: string[] = []
		let jumped = false
		let originalOffset = offset
		let maxJumps = 10

		while (offset < buffer.length && maxJumps > 0) {
			const len = buffer[offset]

			if (len === 0) {
				offset++
				break
			}

			if ((len & 0xc0) === 0xc0) {
				if (!jumped) originalOffset = offset + 2
				offset = buffer.readUInt16BE(offset) & 0x3fff
				jumped = true
				maxJumps--
				continue
			}

			if (offset + len + 1 > buffer.length) break

			const label = buffer
				.subarray(offset + 1, offset + 1 + len)
				.toString('ascii')
			labels.push(label)
			offset += len + 1
		}

		return {
			name: labels.join('.') || '',
			newOffset: jumped ? originalOffset : offset,
		}
	}

	buildDnsResponse(
		originalQuery: ParsedDnsMessage,
		answers: DnsAnswer[]
	): Buffer | null {
		if (originalQuery.questions.length === 0) return null

		const question = originalQuery.questions[0]
		let totalSize = DNS_HEADER_SIZE

		const questionSection = this.encodeQuestion(question)
		totalSize += questionSection.length

		let answerSection = Buffer.alloc(0)
		for (const answer of answers) {
			const encoded = this.encodeAnswer(answer)
			answerSection = Buffer.concat([answerSection, encoded])
			totalSize += encoded.length
		}

		const response = Buffer.alloc(totalSize)
		response.writeUInt16BE(originalQuery.id, 0)

		const flags = DNS_RA_FLAG | (originalQuery.flags & DNS_OPCODE_MASK)
		response.writeUInt16BE(flags, 2)
		response.writeUInt16BE(1, 4) // QDCOUNT
		response.writeUInt16BE(answers.length, 6) // ANCOUNT
		response.writeUInt16BE(0, 8) // NSCOUNT
		response.writeUInt16BE(0, 10) // ARCOUNT

		questionSection.copy(response, DNS_HEADER_SIZE)
		answerSection.copy(response, DNS_HEADER_SIZE + questionSection.length)

		return response
	}

	private encodeQuestion(question: DnsQuestion): Buffer {
		const parts = question.name.split('.')
		const nameBuffers: Buffer[] = []

		for (const part of parts) {
			const len = Buffer.alloc(1)
			len.writeUInt8(part.length)
			nameBuffers.push(len)
			nameBuffers.push(Buffer.from(part, 'ascii'))
		}
		nameBuffers.push(Buffer.alloc(1)) // root

		const nameBuffer = Buffer.concat(nameBuffers)
		const questionBuffer = Buffer.alloc(nameBuffer.length + 4)
		nameBuffer.copy(questionBuffer, 0)
		questionBuffer.writeUInt16BE(question.type, nameBuffer.length)
		questionBuffer.writeUInt16BE(question.class, nameBuffer.length + 2)

		return questionBuffer
	}

	private encodeAnswer(answer: DnsAnswer): Buffer {
		const nameBuffer = Buffer.from(answer.name, 'ascii')
		const header = Buffer.alloc(10)
		header.writeUInt16BE(answer.type, 0)
		header.writeUInt16BE(answer.class, 2)
		header.writeUInt32BE(answer.ttl, 4)
		header.writeUInt16BE(answer.data.length, 8)

		return Buffer.concat([nameBuffer, header, answer.data])
	}

	rewriteDnsServer(
		packet: DnsPacket,
		newResolver: string
	): DnsPacket {
		const ipParts = newResolver.split('.').map(Number)
		if (ipParts.length !== 4) return packet

		const newDst = Buffer.from(ipParts)
		const modified = Buffer.from(packet.data)

		const ipHeaderLen = (modified[0] & 0x0f) * 4
		modified[16] = newDst[0]
		modified[17] = newDst[1]
		modified[18] = newDst[2]
		modified[19] = newDst[3]

		const udpChecksumOffset = ipHeaderLen + 6
		modified[udpChecksumOffset] = 0
		modified[udpChecksumOffset + 1] = 0

		this.recalculateIpChecksum(modified, ipHeaderLen)
		this.recalculateUdpChecksum(
			modified,
			ipHeaderLen,
			packet.srcAddr,
			newResolver
		)

		return { ...packet, data: modified, dstAddr: newResolver }
	}

	private recalculateIpChecksum(packet: Buffer, ipHeaderLen: number): void {
		packet[10] = 0
		packet[11] = 0

		let sum = 0
		for (let i = 0; i < ipHeaderLen; i += 2) {
			sum += (packet[i] << 8) | packet[i + 1]
		}

		while (sum >> 16) {
			sum = (sum & 0xffff) + (sum >> 16)
		}

		const checksum = ~sum & 0xffff
		packet[10] = (checksum >> 8) & 0xff
		packet[11] = checksum & 0xff
	}

	private recalculateUdpChecksum(
		packet: Buffer,
		ipHeaderLen: number,
		srcAddr: string,
		dstAddr: string
	): void {
		const udpOffset = ipHeaderLen
		const udpLength = packet.readUInt16BE(udpOffset + 4)

		const pseudoHeader = this.buildPseudoHeader(
			srcAddr,
			dstAddr,
			udpLength
		)

		const udpData = Buffer.from(
			packet.subarray(udpOffset, udpOffset + udpLength)
		)
		const checksumData = Buffer.concat([pseudoHeader, udpData])

		let sum = 0
		for (let i = 0; i < checksumData.length; i += 2) {
			const word =
				i + 1 < checksumData.length
					? (checksumData[i] << 8) | checksumData[i + 1]
					: checksumData[i] << 8
			sum += word
		}

		while (sum >> 16) {
			sum = (sum & 0xffff) + (sum >> 16)
		}

		const checksum = ~sum & 0xffff
		packet[udpOffset + 6] = (checksum >> 8) & 0xff
		packet[udpOffset + 7] = checksum & 0xff
	}

	private buildPseudoHeader(
		srcAddr: string,
		dstAddr: string,
		udpLength: number
	): Buffer {
		const src = srcAddr.split('.').map(Number)
		const dst = dstAddr.split('.').map(Number)

		const header = Buffer.alloc(12)
		header[0] = src[0]
		header[1] = src[1]
		header[2] = src[2]
		header[3] = src[3]
		header[4] = dst[0]
		header[5] = dst[1]
		header[6] = dst[2]
		header[7] = dst[3]
		header[8] = 0
		header[9] = 17 // UDP protocol
		header.writeUInt16BE(udpLength, 10)

		return header
	}
}
