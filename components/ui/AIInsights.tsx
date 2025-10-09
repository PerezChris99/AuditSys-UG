import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { getAIInsights } from '../../lib/gemini';
import { SparklesIcon } from './Icons';
import { marked } from 'marked';

const AIInsights: React.FC = () => {
    const { tickets, discrepancies } = useData();
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInsights = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Get data from the last 24 hours for analysis
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentTickets = tickets.filter(t => new Date(t.travelDate) > oneDayAgo);
            const recentDiscrepancies = discrepancies.filter(d => new Date(d.reportedAt) > oneDayAgo);

            if (recentTickets.length === 0 && recentDiscrepancies.length === 0) {
                 setInsights('<p class="text-gray-500">No significant activity in the last 24 hours to analyze.</p>');
                 return;
            }

            const result = await getAIInsights(recentTickets, recentDiscrepancies);
            const html = await marked.parse(result);
            setInsights(html);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [tickets, discrepancies]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            );
        }
        if (error) {
            return <p className="text-red-500 text-sm">Error: {error}</p>;
        }
        return <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: insights }} />;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <SparklesIcon className="h-6 w-6 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-700">AI-Powered Anomaly Insights</h3>
                </div>
                <button
                    onClick={fetchInsights}
                    disabled={isLoading}
                    className="text-sm font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50"
                >
                    Refresh
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default AIInsights;
