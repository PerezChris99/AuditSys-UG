import { Agent, Ticket, Transaction, TransactionStatus } from '../types';
import { calculateHash } from './cryptoUtils';

const sampleNames = ["Amelia Earhart", "Charles Lindbergh", "Bessie Coleman", "Wright Brothers", "Chuck Yeager"];
const sampleAirports = {
    EBB: "Entebbe",
    NBO: "Nairobi",
    JNB: "Johannesburg",
    LOS: "Lagos",
    ADD: "Addis Ababa",
    CAI: "Cairo",
};

export const generateNewTicket = (agents: Agent[]): Ticket => {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const price = Math.floor(Math.random() * 800) + 200;
    const airportCodes = Object.keys(sampleAirports);
    const origin = airportCodes[Math.floor(Math.random() * airportCodes.length)];
    let destination = airportCodes[Math.floor(Math.random() * airportCodes.length)];
    while (origin === destination) {
        destination = airportCodes[Math.floor(Math.random() * airportCodes.length)];
    }

    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + Math.floor(Math.random() * 30));

    return {
        id: `TKT-${Date.now()}`,
        passengerName: sampleNames[Math.floor(Math.random() * sampleNames.length)],
        flightNumber: `UG${Math.floor(Math.random() * 900) + 100}`,
        origin,
        destination,
        travelDate: travelDate.toISOString().split('T')[0],
        price,
        agentId: agent.id,
        status: TransactionStatus.Completed,
    };
};

export const generateNewTransaction = async (ticket: Ticket, previousHash: string): Promise<Transaction> => {
    const timestamp = new Date().toISOString();
    const id = `TXN-${Date.now()}`;
    const amount = ticket.price;
    const associatedRecordId = ticket.id;

    // The hash is calculated asynchronously. 
    // For this mock, we'll use a placeholder and update it when the real hash is ready.
    // In a real app, you might show a "pending" state.
    const hash = await calculateHash(id, timestamp, amount, associatedRecordId, previousHash);
    
    return {
        id,
        type: 'Sale',
        amount,
        timestamp,
        associatedRecordId,
        agentId: ticket.agentId,
        hash,
        previousHash,
    };
};
