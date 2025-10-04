import { Transaction } from '../types';

// A simple, non-cryptographic hash function for demonstration purposes.
// In a real application, a proper cryptographic hash like SHA-256 should be used.
export const calculateHash = (txData: Omit<Transaction, 'hash' | 'previousHash'>): string => {
    const dataString = `${txData.id}${txData.timestamp}${txData.type}${txData.amount}${txData.associatedRecordId}${txData.agentId}`;
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    // Convert to a 16-character hex string for consistency
    return ('0000000000000000' + (hash >>> 0).toString(16)).slice(-16);
};
