
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Settings {
    transactionThreshold: number;
    simulationInterval: number;
    maintenanceMode: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = {
    transactionThreshold: 1000,
    simulationInterval: 5000, // 5 seconds
    maintenanceMode: false,
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const storedSettings = localStorage.getItem('auditSysSettings');
            return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
            return defaultSettings;
        }
    });

    const updateSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        localStorage.setItem('auditSysSettings', JSON.stringify(newSettings));
    };

    const value = { settings, updateSettings };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
