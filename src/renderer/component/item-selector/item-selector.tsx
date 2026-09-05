import type React from 'react'
import { cn } from '../../utils/cn'

interface Props {
	isActive: boolean
	onClick: () => void
	label: string | React.ReactNode
	description?: string | React.ReactNode
	className?: string
	style?: React.CSSProperties
}
export function ItemSelector({
	isActive,
	onClick,
	label,
	description,
	className,
	style,
}: Props) {
	return (
		<div
			onClick={onClick}
			className={cn(
				'flex cursor-pointer flex-col items-start p-2 transition-all border rounded-xl',
				className,
				isActive
					? 'border-primary/25 bg-primary/20'
					: 'bg-base-300/25 border-base-300 hover:border-primary/15! hover:bg-primary/5!'
			)}
			style={style}
		>
			<div className="flex items-center justify-center gap-2">
				<div
					className={cn(
						'w-4 h-4 rounded-full text-white border',
						isActive
							? 'border-primary bg-primary'
							: 'border-base-100 bg-base-300/60'
					)}
				>
					{isActive && (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="w-full h-full p-0.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={3}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					)}
				</div>
				<span className={'mr-1.5 text-sm font-medium text-content'}>{label}</span>
			</div>
			{description && (
				<div className={'text-xs text-muted text-right'}>{description}</div>
			)}
		</div>
	)
}
