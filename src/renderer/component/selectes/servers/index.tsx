import { useContext } from 'react'
import type { ServerStore } from '../../../../shared/interfaces/server.interface'
import { serversContext } from '../../../context/servers.context'
import type { ServersContext } from '../../../interfaces/servers-context.interface'

export function ServersListSelectComponent() {
	const serversStateContext = useContext(serversContext)
	const selectedDef =
		serversStateContext.selected?.key === 'unknown' || !serversStateContext.selected
	function onChange(key: string) {
		const server = serversStateContext.servers.find((ser) => ser.key === key)
		serversStateContext.setSelected(server)
	}
	return (
		<select
			className={
				'select w-full  bg-base-200  outline-primary/30 border-none rounded-2xl cursor-pointer'
			}
			onChange={(data) => onChange(data.target.value)}
		>
			<option value={'default'} selected={selectedDef} disabled={true}>
				Pick your favorite Server
			</option>
			{servers(serversStateContext)}
		</select>
	)
}

function servers(serversStateContext: ServersContext): any {
	const pinsServers = serversStateContext.servers.filter((ser) => ser.isPin)

	const renderServer = (server: ServerStore) => {
		const isConnect = serversStateContext.currentActive?.key === server.key
		return (
			<option
				key={server.key}
				value={server.key}
				selected={server.key === serversStateContext.selected?.key}
			>
				{server.name}
				{isConnect ? (
					<div className="w-2 h-2 rounded-full bg-success animate-pulse" />
				) : (
					''
				)}
			</option>
		)
	}

	const pins = pinsServers.map(renderServer)

	if (pins.length > 0) {
		pins.unshift(
			<option
				key=""
				value=""
				disabled={true}
				className="text-center bg-gray-300 text-gray-600 dark:bg-[#262626] dark:text-gray-500 mt-5"
			>
				Pinned
			</option>
		)
	}

	const allServers = serversStateContext.servers.filter((ser) => !ser.isPin)
	const all = allServers.map(renderServer)
	all.unshift(
		<option
			key=""
			value=""
			disabled={true}
			className="text-center bg-gray-300 text-gray-600 dark:bg-[#262626] dark:text-gray-500"
		>
			All
		</option>
	)

	return [...pins, ...all]
}
