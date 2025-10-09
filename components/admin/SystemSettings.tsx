import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';

const SystemSettings: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const { generateDataPoint } = useData();
    const [localSettings, setLocalSettings] = useState(settings);
    const [errors, setErrors] = useState({ transactionThreshold: '', form: '' });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateStatus, setGenerateStatus] = useState<'idle' | 'success'>('idle');
    const isFormValid = !errors.transactionThreshold;

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let parsedValue: string | number | boolean;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            parsedValue = checked;
        } else {
            parsedValue = Number(value);
            if (name === 'transactionThreshold') {
                if (parsedValue < 0) {
                    setErrors(prev => ({ ...prev, transactionThreshold: 'Threshold cannot be negative.' }));
                } else {
                    setErrors(prev => ({ ...prev, transactionThreshold: '' }));
                }
            }
        }
        
        setLocalSettings(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        
        setErrors(prev => ({...prev, form: ''}));
        setSaveStatus('saving');
        
        try {
            updateSettings(localSettings);
            setTimeout(() => {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }, 500);
        } catch (error: any) {
            setErrors(prev => ({...prev, form: error.message || 'An unexpected error occurred.'}));
            setSaveStatus('idle');
        }
    };

    const handleManualGenerate = async () => {
        setIsGenerating(true);
        setGenerateStatus('idle');
        try {
            await generateDataPoint();
            setGenerateStatus('success');
            setTimeout(() => setGenerateStatus('idle'), 2000);
        } catch (error) {
            console.error("Manual generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">System Configuration</h2>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                    <div>
                        <label htmlFor="transactionThreshold" className="block text-sm font-medium text-gray-700">
                           High-Value Transaction Threshold ($)
                        </label>
                        <p className="text-xs text-gray-500 mb-1">Set the amount above which a transaction triggers a "Transaction Anomaly" notification.</p>
                        <input
                            type="number"
                            name="transactionThreshold"
                            id="transactionThreshold"
                            value={localSettings.transactionThreshold}
                            onChange={handleChange}
                            className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {errors.transactionThreshold && <p className="mt-1 text-sm text-red-600">{errors.transactionThreshold}</p>}
                    </div>

                    <div>
                        <label htmlFor="simulationInterval" className="block text-sm font-medium text-gray-700">
                           Data Simulation Speed
                        </label>
                         <p className="text-xs text-gray-500 mb-1">Control how frequently new ticket sales and transactions are generated in the system.</p>
                        <select
                            name="simulationInterval"
                            id="simulationInterval"
                            value={localSettings.simulationInterval}
                            onChange={handleChange}
                            className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                            <option value={3000}>Fast (3 seconds)</option>
                            <option value={5000}>Normal (5 seconds)</option>
                            <option value={10000}>Slow (10 seconds)</option>
                        </select>
                    </div>

                    <div className="border-t pt-6">
                         <h3 className="text-lg font-medium text-gray-900">Maintenance Mode</h3>
                          <p className="text-xs text-gray-500 mb-2">When enabled, a banner will be displayed to all users informing them of system maintenance.</p>
                        <label htmlFor="maintenanceMode" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="maintenanceMode"
                                    name="maintenanceMode"
                                    checked={localSettings.maintenanceMode}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                <div className="block bg-gray-200 w-14 h-8 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${localSettings.maintenanceMode ? 'translate-x-6 bg-primary-600' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-gray-700 font-medium">
                                {localSettings.maintenanceMode ? 'Enabled' : 'Disabled'}
                            </div>
                        </label>
                    </div>
                    
                    {errors.form && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.form}</p>}

                    <div className="flex items-center space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={saveStatus === 'saving' || !isFormValid}
                            className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
                        >
                           {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
                        </button>
                         {saveStatus === 'saved' && (
                            <span className="text-green-600 font-medium text-sm">Settings saved successfully!</span>
                        )}
                    </div>
                </form>

                <div className="border-t mt-8 pt-6 max-w-2xl">
                    <h3 className="text-lg font-medium text-gray-900">Manual Data Actions</h3>
                    <p className="text-xs text-gray-500 mb-2">Manually generate a single new ticket and its associated transaction. This is useful for testing or demonstration.</p>
                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={handleManualGenerate}
                            disabled={isGenerating}
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? 'Generating...' : 'Generate New Transaction'}
                        </button>
                        {generateStatus === 'success' && (
                            <span className="text-green-600 font-medium text-sm">New transaction generated successfully!</span>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SystemSettings;
