import { IoClose } from 'react-icons/io5'
import { VscChromeMinimize } from 'react-icons/vsc'
import { BsGithub } from 'react-icons/bs'
import { Button } from '../button/button'

export function NavbarComponent() {
	return (
		<div>
			<div className="bg-base-300 navbar">
				<div className="flex-1 pl-5">
					<h1 className="text-2xl mt-1 font-[balooTamma] text-[#75767c]">
						MNX DNS
					</h1>
				</div>
				<div className="flex-none">
					<div className="flex flex-row-reverse items-center gap-1">
						<Button
							className="rounded-lg btn-ghost hover:bg-error hover:text-gray-100"
							size="sm"
							onClick={() => window.ipc.close()}
						>
							<IoClose />
						</Button>

						<Button
							className="rounded-lg btn-ghost"
							size="sm"
							onClick={() => window.ipc.minimize()}
						>
							<VscChromeMinimize />
						</Button>

						<Button
							className="text-[#616161] hover:text-current btn-ghost rounded-lg"
							size="xs"
							onClick={() =>
								window.ipc.openBrowser(
									'https://github.com/RADINMNX2/MNX-DNS'
								)
							}
						>
							<BsGithub />
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
