import { ipcMain } from 'electron'

import { EventsKeys } from '../../shared/constants/eventsKeys.constant'
import { DnsBenchmarkRequest, DnsBenchmarkResponse } from '../../shared/interfaces/dns-benchmark.interface'
import { benchmarkServers } from '../services/dns-benchmark.service'
import { userLogger } from '../shared/logger'

ipcMain.handle(
	EventsKeys.BENCHMARK_DNS,
	async (event, payload: DnsBenchmarkRequest): Promise<DnsBenchmarkResponse> => {
		try {
			const { targetUrl, servers } = payload || ({} as DnsBenchmarkRequest)

			if (!targetUrl || !servers?.length) {
				return {
					success: false,
					results: [],
					message: 'Target URL and DNS list are required',
				}
			}

			const results = await benchmarkServers(servers, targetUrl)

			return { success: true, results }
		} catch (e) {
			userLogger.error(e.stack, e.message)
			return {
				success: false,
				results: [],
				message: 'Unknown error while testing DNS servers',
			}
		}
	}
)
