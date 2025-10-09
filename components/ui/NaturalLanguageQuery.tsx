import React, { useState } from 'react';
import { SparklesIcon } from './Icons';
import { parseNaturalLanguageQuery, parseLedgerQuery } from '../../lib/gemini';
import { Agent } from '../../types';

interface NaturalLanguageQueryProps {
    onQueryApplied: (filters: any) => void;
    queryType: 'tickets' | 'ledger';
    agents?: Agent[];
    placeholder?: string;
}

const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({ onQueryApplied, queryType, agents, placeholder }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            let parsedFilters;
            if (queryType === 'tickets') {
                parsedFilters = await parseNaturalLanguageQuery(query);
            } else if (queryType === 'ledger') {
                if (!agents) {
                    throw new Error("Agent data is required for this type of query.");
                }
                parsedFilters = await parseLedgerQuery(query, agents);
            }
            onQueryApplied(parsedFilters);
        } catch (err: any) {
            setError(err.message || 'Failed to process query.');
        } finally {
            setIsLoading(false);
        }
    };

    const defaultPlaceholder = queryType === 'tickets' 
        ? "e.g., tickets to JNB over $500 sold last week"
        : "e.g., fee transactions by Kato Mukasa this year";

    return (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <form onSubmit={handleSubmit}>
                <label htmlFor="ai-query" className="flex items-center text-md font-semibold text-primary-800 mb-2">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Ask a question to filter data
                </label>
                <div className="flex space-x-2">
                    <input
                        id="ai-query"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder || defaultPlaceholder}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center w-32"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Apply Filter'
                        )}
                    </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </form>
        </div>
    );
};

export default NaturalLanguageQuery;
