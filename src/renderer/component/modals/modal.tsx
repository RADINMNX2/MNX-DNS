import React, { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IoClose } from 'react-icons/io5'

type ModalProps = {
	isOpen: boolean
	onClose: () => void
	title?: React.ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
	children: ReactNode
	direction?: 'rtl' | 'ltr'
	closeOnBackdropClick?: boolean
	showCloseButton?: boolean
	className?: string
}

const sizeClasses = {
	sm: 'max-w-sm max-h-[80vh]',
	md: 'max-w-md max-h-[80vh]',
	lg: 'max-w-lg max-h-[80vh]',
	xl: 'max-w-4xl max-h-[80vh]',
	full: 'max-w-[95vw] max-h-[95vh]',
} as const

export default function Modal({
	isOpen,
	onClose,
	title,
	size = 'md',
	children,
	closeOnBackdropClick = true,
	direction = 'ltr',
	showCloseButton = true,
	className = '',
}: ModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		if (isOpen) {
			dialogRef.current?.showModal()
		} else {
			dialogRef.current?.close()
		}
	}, [isOpen])

	const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
		if (!closeOnBackdropClick) return
		const rect = dialogRef.current?.getBoundingClientRect()
		if (!rect) return
		const isClickOutside =
			e.clientX < rect.left ||
			e.clientX > rect.right ||
			e.clientY < rect.top ||
			e.clientY > rect.bottom
		if (isClickOutside) {
			onClose()
		}
	}

	const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
		e.preventDefault()
		onClose()
	}

	const sizeClass = sizeClasses[size] || sizeClasses.md

	return createPortal(
		<dialog
			ref={dialogRef}
			dir={direction}
			onCancel={handleCancel}
			onClick={handleBackdropClick}
			className="modal"
		>
			<div
				className={`
          modal-box 
          rounded-xl md:rounded-2xl 
          p-3 md:p-4 
          shadow-xl 
          overflow-hidden
          ${sizeClass}
          ${className}
        `}
			>
				{(title || showCloseButton) && (
					<div className="flex items-center justify-between gap-2 mb-2 md:mb-3 md:gap-4">
						{title && (
							<h3 className="text-base font-semibold md:text-lg">
								{title}
							</h3>
						)}
						{showCloseButton && (
							<button
								type="button"
								onClick={onClose}
								className="min-h-0 p-0 rounded-full  btn btn-sm btn-ghost w-7 h-7 md:w-8 md:h-8 text-base-content/60 hover:text-base-content hover:bg-base-content/10"
								aria-label="Close modal"
							>
								<IoClose className="w-5 h-5" />
							</button>
						)}
					</div>
				)}
				<div
					className={`
            overflow-y-auto overflow-x-hidden 
            pr-0.5 md:pr-1
            ${size !== 'full' ? 'max-h-[70vh]' : 'max-h-[85vh]'}
          `}
				>
					{children}
				</div>
			</div>
		</dialog>,
		document.body
	)
}
