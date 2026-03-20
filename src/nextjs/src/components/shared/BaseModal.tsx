'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    contentClassName?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    maxWidth = 'md',
    className,
    contentClassName,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" data-testid="base-modal">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                className={clsx(
                    "relative bg-white w-full rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-out",
                    "max-h-[min(90vh,800px)]", // Ensure it fits in viewport and has a sensible max depth
                    maxWidthClasses[maxWidth],
                    className
                )}
            >
                {/* Header */}
                {(title || subtitle) && (
                    <div className="px-6 pt-6 pb-4 flex justify-between items-start shrink-0 border-b border-border/5">
                        <div className="min-w-0 pr-4">
                            {title && <h2 className="text-lg font-black text-[#3E4A61] leading-tight truncate">{title}</h2>}
                            {subtitle && <p className="text-[10px] font-black text-[#CBD5E0] uppercase tracking-widest mt-1 truncate">{subtitle}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#F7FAFC] text-[#CBD5E0] hover:text-[#3E4A61] transition-all border border-[#EDF2F7] shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {!title && !subtitle && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-[#F7FAFC]/80 backdrop-blur-sm text-[#CBD5E0] hover:text-[#3E4A61] transition-all border border-[#EDF2F7]"
                    >
                        <X size={16} />
                    </button>
                )}

                {/* Content */}
                <div className={clsx(
                    "p-6 overflow-y-auto custom-scrollbar flex-1",
                    contentClassName
                )}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 pb-6 pt-2 shrink-0 border-t border-border/5 bg-white">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

