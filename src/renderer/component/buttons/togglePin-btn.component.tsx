import { useContext, useEffect, useState } from 'react'

import { serversContext } from '../../context/servers.context'
import type { ServersContext } from '../../interfaces/servers-context.interface'
import { BsPin, BsPinFill } from 'react-icons/bs'
import { Button } from '../button/button'

export function ToggleButtonComponent() {
	const serversStateContext = useContext<ServersContext>(serversContext)
	const server = serversStateContext.selected
	const [isPin, setIsPin] = useState<boolean>()

	useEffect(() => {
		if (serversStateContext.selected) setIsPin(serversStateContext.selected.isPin)
	}, [serversStateContext.selected])

	if (!server) return null

	async function handleClick() {
		if (!server) return
		const res = await window.ipc.togglePinServer(server)
		if (res.success) {
			server.isPin = !server.isPin
			setIsPin(server.isPin)
			console.log(server.isPin)
			serversStateContext.setServers(res.servers)
		}
	}

	return (
		<Button size={'sm'} className={'btn-ghost rounded-xl'} onClick={handleClick}>
			{isPin ? <BsPinFill size={12} /> : <BsPin size={12} />}
		</Button>
	)
}
