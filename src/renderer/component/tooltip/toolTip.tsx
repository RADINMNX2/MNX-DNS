import type { ReactNode } from 'react'

type Position =
	| 'top'
	| 'right'
	| 'bottom'
	| 'left'
	| 'bottom-right'
	| 'bottom-left'
	| 'top-right'
	| 'top-left'

interface TooltipProps {
	children: ReactNode
	content: ReactNode | null
	position?: Position
}

const Tooltip = ({ children, content }: TooltipProps) => {
	return (
		<div className="tooltip tooltip-left" data-tip={content}>
			{children}
		</div>
	)
}

export default Tooltip
