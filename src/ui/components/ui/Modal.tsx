"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const dialogRef = React.useRef<HTMLDialogElement>(null)

    React.useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen) {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            className={cn(
                "fixed inset-0 z-50 m-0 w-full h-full bg-black/50 p-0 flex items-center justify-center border-none",
                className
            )}
            onClick={(e) => {
                if (e.target === dialogRef.current) onClose()
            }}
            data-testid="boring-modal"
        >
            <div
                className="bg-white border border-slate-300 w-full max-w-lg p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 className="text-xl font-bold">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="p-1 border border-slate-200 hover:bg-slate-100"
                        aria-label="Close"
                        data-testid="modal-close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </dialog>
    )
}
