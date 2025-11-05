'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/ui/components/ui/dialog';
import { Button } from '@/ui/components/ui/button';
import { cn } from '@/lib/utils';

interface AlertModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    message: string;
    confirmText?: string;
    variant?: 'default' | 'warning' | 'error' | 'info';
}

export function AlertModal({
    open,
    onOpenChange,
    title,
    message,
    confirmText = 'OK',
    variant = 'default',
}: AlertModalProps) {
    const handleConfirm = () => {
        onOpenChange(false);
    };

    const variantStyles = {
        default: {
            title: 'text-sakura-text-primary',
            message: 'text-sakura-text-secondary',
            button: 'bg-sakura-accent-primary hover:bg-sakura-accent-primary/90 text-white',
        },
        warning: {
            title: 'text-orange-600',
            message: 'text-orange-500',
            button: 'bg-orange-500 hover:bg-orange-600 text-white',
        },
        error: {
            title: 'text-red-600',
            message: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-600 text-white',
        },
        info: {
            title: 'text-blue-600',
            message: 'text-blue-500',
            button: 'bg-blue-500 hover:bg-blue-600 text-white',
        },
    };

    const styles = variantStyles[variant];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    {title && (
                        <DialogTitle className={cn('text-xl font-black uppercase tracking-wider', styles.title)}>
                            {title}
                        </DialogTitle>
                    )}
                    <DialogDescription className={cn('text-base font-bold leading-relaxed mt-2', styles.message)}>
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        onClick={handleConfirm}
                        className={cn(
                            'min-w-[100px] font-black uppercase tracking-wider rounded-xl',
                            styles.button
                        )}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
