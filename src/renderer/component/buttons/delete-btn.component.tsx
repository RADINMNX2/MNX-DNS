import { useContext, useState } from 'react'
import { AiOutlineDelete } from 'react-icons/ai'
import { serversContext } from '../../context/servers.context'
import type { ServersContext } from '../../interfaces/servers-context.interface'
import { appNotif } from '../../notifications/appNotif'
import { ConfirmationModal } from '../modals/confirmation-modal'
import { Button } from '../button/button'

export function DeleteButtonComponent() {
	const [open, setOpen] = useState(false)
	const serversStateContext = useContext<ServersContext>(serversContext)
	const server = serversStateContext.selected
	const handleOpen = () => setOpen(!open)

	const handleDelete = async () => {
		if (!server) return
		if (server?.key === serversStateContext.currentActive?.key) {
			setOpen(false)
			appNotif('Error', 'cannot delete the active server')
			return
		}

		const response = await window.ipc.deleteDns(server)
		setOpen(false)
		appNotif('Success', `${server.name} Deleted!`, 'SUCCESS')
		serversStateContext.setSelected(null)
		serversStateContext.setServers(response.servers)
		if (serversStateContext.currentActive) {
			serversStateContext.setSelected(serversStateContext.currentActive)
		}
	}
	if (!server) return null
	return (
		<>
			<Button size={'sm'} className={'btn-ghost rounded-xl'} onClick={handleOpen}>
				<AiOutlineDelete
					className={'dark:text-gray-600 text-gray-800'}
					size={12}
				/>
			</Button>
			<ConfirmationModal
				isOpen={open}
				onClose={handleOpen}
				onConfirm={handleDelete}
			></ConfirmationModal>
		</>
	)
}
