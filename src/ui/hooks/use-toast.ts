'use client';

export function useToast() {
    return {
        toast: ({ title, description, variant }: any) => {
            console.log(`[Toast] ${variant === 'destructive' ? 'ERROR' : 'INFO'}: ${title} - ${description}`);
        },
        toasts: []
    };
}
