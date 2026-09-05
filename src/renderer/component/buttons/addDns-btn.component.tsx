import { useContext, useState } from 'react'
import { MdOutlineAddModerator } from 'react-icons/md'
import { serversContext } from '../../context/servers.context'
import { AddDnsModalComponent } from '../modals/add-dns.component'
import Tooltip from '../tooltip/toolTip'
import { Button } from '../button/button'

export function AddCustomDnsButton() {
	const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
	const serversStateContext = useContext(serversContext)

	function toggleOpenModal() {
		setIsOpenModal(!isOpenModal)
	}

	return (
		<div>
			<Tooltip content="Add Custom DNS" position="left">
				<Button
					size={'sm'}
					onClick={toggleOpenModal}
					className={'bg-base-200 hover:bg-base-200/80 rounded-xl'}
				>
					<MdOutlineAddModerator className="text-base-content/80" size={14} />
				</Button>
				<AddDnsModalComponent
					isOpen={isOpenModal}
					setIsOpen={setIsOpenModal}
					cb={(va) => {
						serversStateContext.servers.push(va)
						serversStateContext.setServers([...serversStateContext.servers])
					}}
				/>
			</Tooltip>
		</div>
	)
}
