import { WindowsPlatform } from '../windows.platform'
import { Interface } from '../interfaces/interface'
import * as sudo from '@vscode/sudo-prompt'

describe('WinPlatform()', () => {
	let windowsPlatform: WindowsPlatform

	beforeEach(() => {
		windowsPlatform = new WindowsPlatform()
	})

	it("should return '1.1.1.1' for active server", () => {
		const currentServer: Array<string> = ['1.1.1.1', '1.1.1.1']

		jest
			.spyOn(WindowsPlatform.prototype as any, 'extractDns')
			.mockImplementation(() => currentServer)

		const activeInterface: Interface = {
			name: '',
			gateway_ip: '',
			ip_address: '',
			model: '',
			type: '',
			vendor: '',
			netmask: '',
			mac_address: '',
		}
		jest
			.spyOn(WindowsPlatform.prototype as any, 'getValidateInterface')
			.mockImplementation(() => activeInterface)

		jest
			.spyOn(WindowsPlatform.prototype as any, 'execCmd')
			.mockImplementation(() => '')

		expect(windowsPlatform.getActiveDns()).resolves.toBe(currentServer)
	})

	describe('getInterfacesList', () => {
		it('should return a list of interfaces including Wi-Fi', async () => {
			const interfaces = await windowsPlatform.getInterfacesList()
			expect(Array.isArray(interfaces)).toBe(true)
			expect(interfaces.length).toBeGreaterThan(0)
			
			// On this machine we know there is a Wi-Fi interface
			const wifi = interfaces.find(i => i.name === 'Wi-Fi')
			expect(wifi).toBeDefined()
			expect(wifi.type).toBe('Wireless')
		})
	})

	describe('SetDns', () => {
		it('should called execCmd', async () => {
			const validatedInterface = {
				name: 'xx',
			} as any
			jest
				.spyOn(WindowsPlatform.prototype as any, 'getValidateInterface')
				.mockImplementation(() => validatedInterface)

			jest
				.spyOn(WindowsPlatform.prototype as any, 'execCmd')
				.mockImplementation()

			await windowsPlatform.setDns(['1.1.1.1', '1.1.1.1'])

			// @ts-ignore
			expect(WindowsPlatform.prototype.execCmd).toHaveBeenCalledTimes(2)
		})

		it('should called once execCmd', async () => {
			const validatedInterface = {
				name: 'xx',
			} as any
			jest
				.spyOn(WindowsPlatform.prototype as any, 'getValidateInterface')
				.mockImplementation(() => validatedInterface)

			jest
				.spyOn(WindowsPlatform.prototype as any, 'execCmd')
				.mockImplementation()

			await windowsPlatform.setDns(['1.1.1.1'])

			// @ts-ignore
			expect(WindowsPlatform.prototype.execCmd).toHaveBeenCalledTimes(1)
		})
	})

	describe('flushDns()', () => {
		let windowsPlatform: WindowsPlatform

		beforeEach(() => {
			windowsPlatform = new WindowsPlatform()
		})

		it('should execute ipconfig /flushdns command', async () => {
			jest
				.spyOn(sudo, 'exec')
				.mockImplementation((command, options, callback) => {
					expect(command).toBe('ipconfig /flushdns')
					expect(options).toEqual({ name: 'MNX DNS' })
					callback(null)
				})

			await windowsPlatform.flushDns()

			expect(sudo.exec).toHaveBeenCalledTimes(1)
		})

		it('should reject with error message if command execution fails', async () => {
			const errorMessage = 'Failed to execute command'
			jest
				.spyOn(sudo, 'exec')
				.mockImplementation((command, options, callback) => {
					callback(new Error(errorMessage))
				})

			await expect(windowsPlatform.flushDns()).rejects.toThrow(errorMessage)
			expect(sudo.exec).toHaveBeenCalledTimes(1)
		})
	})
})
