import { Agent, Ticket, Transaction, TransactionStatus, Discrepancy, DiscrepancyStatus } from '../types';
import { calculateHash } from './cryptoUtils';

const CITIES = ['EBB', 'JNB', 'NBO', 'KGL', 'DAR'];

export const generateNewLiveData = (
    agents: Agent[], 
    allTickets: Ticket[], 
    allTransactions: Transaction[],
    discrepancyCount: number
) => {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const origin = CITIES[Math.floor(Math.random() * CITIES.length)];
    let destination = CITIES[Math.floor(Math.random() * CITIES.length)];
    while (destination === origin) {
        destination = CITIES[Math.floor(Math.random() * CITIES.length)];
    }
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + Math.floor(Math.random() * 30));

    const newTicketId = `TCK-${7000 + allTickets.length + 1}`;
    const newTicket: Ticket = {
        id: newTicketId,
        passengerName: `Passenger ${allTickets.length + 1}`,
        flightNumber: `UG${Math.floor(Math.random() * 500) + 100}`,
        origin,
        destination,
        travelDate: travelDate.toISOString().split('T')[0],
        price: (Math.random() > 0.05) ? (Math.random() * 800) + 200 : (Math.random() * 1000) + 1001,
        agentId: agent.id,
        status: TransactionStatus.Completed,
    };

    const newTransactionId = `TRN-${90000 + allTransactions.length + 1}`;
    const newTransactionData = {
        id: newTransactionId,
        type: 'Sale' as const,
        amount: newTicket.price,
        timestamp: new Date().toISOString(),
        associatedRecordId: newTicketId,
        agentId: agent.id,
    };

    const previousHash = allTransactions.length > 0 ? allTransactions[0].hash : '0'.repeat(16);
    
    const newTransaction: Transaction = {
        ...newTransactionData,
        hash: calculateHash(newTransactionData),
        previousHash: previousHash,
    };
    
    let newDiscrepancy: Discrepancy | null = null;
    // 20% chance to generate a high-priority discrepancy
    if (Math.random() < 0.2 && allTickets.length > 0) {
        const associatedTicket = allTickets[Math.floor(Math.random() * allTickets.length)];
        const associatedTransaction = allTransactions.find(t => t.associatedRecordId === associatedTicket.id);

        if(associatedTransaction) {
            newDiscrepancy = {
                id: `DIS-${500 + discrepancyCount + 1}`,
                type: 'Price Mismatch',
                details: `High-priority alert: Mismatch for ticket ${associatedTicket.id}. Immediate review required.`,
                amount: parseFloat(((Math.random() * 300) + 50).toFixed(2)),
                associatedTransactionId: associatedTransaction.id,
                reportedAt: new Date().toISOString(),
                status: DiscrepancyStatus.ActionRequired,
            };
        }
    }

    return { newTicket, newTransaction, newDiscrepancy };
};