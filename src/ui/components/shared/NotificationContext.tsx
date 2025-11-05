'use client';

import React, { createContext, useContext, useState } from 'react';

interface NotificationContextType {
    show: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const show = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        console.log(`[Notification] ${type.toUpperCase()}: ${message}`);
    };

    return (
        <NotificationContext.Provider value={{ show }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
};
