import { Agent, Ticket, Transaction, Discrepancy, TransactionStatus, DiscrepancyStatus, Note, Task, TaskStatus, TaskPriority } from '../types';
import { calculateHash } from './cryptoUtils';

// Using a seeded random number generator for consistency
let seed = 1;
function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

const sampleNames = ["Kato Mukasa", "Abebe Bikila", "Chinua Achebe", "Wole Soyinka", "Ngozi Adichie", "Binyavanga Wainaina"];
const sampleAirports = {
    EBB: "Entebbe",
    NBO: "Nairobi",
    JNB: "Johannesburg",
    LOS: "Lagos",
    ADD: "Addis Ababa",
    CAI: "Cairo",
};

const generateAgents = (count: number): Agent[] => {
    const agents: Agent[] = [];
    for (let i = 0; i < count; i++) {
        const name = `Agent ${String.fromCharCode(65 + i)}`;
        agents.push({
            id: `UA-AG-00${i + 1}`,
            name: `${sampleNames[i % sampleNames.length]}`,
            avatarUrl: `https://i.pravatar.cc/100?u=agent${i}`,
            ticketsSold: 0,
            totalRevenue: 0,
            accuracy: 98.5 + random() * 1.5,
            disputeRate: 0.5 + random() * 1.0,
            email: `agent${i + 1}@ug-aviation.gov`,
        });
    }
    return agents;
};

const generateTickets = (count: number, agents: Agent[]): Ticket[] => {
    const tickets: Ticket[] = [];
    const airportCodes = Object.keys(sampleAirports);
    for (let i = 0; i < count; i++) {
        const agent = agents[Math.floor(random() * agents.length)];
        const price = Math.floor(random() * 800) + 200;
        const origin = airportCodes[Math.floor(random() * airportCodes.length)];
        let destination = airportCodes[Math.floor(random() * airportCodes.length)];
        while (origin === destination) {
             destination = airportCodes[Math.floor(random() * airportCodes.length)];
        }
        
        const travelDate = new Date();
        travelDate.setDate(travelDate.getDate() + Math.floor(random() * 60) - 30);

        const ticket: Ticket = {
            id: `TKT-${Date.now() - i * 10000}`,
            passengerName: `Passenger ${i + 1}`,
            flightNumber: `UG${Math.floor(random() * 900) + 100}`,
            origin,
            destination,
            travelDate: travelDate.toISOString().split('T')[0],
            price,
            agentId: agent.id,
            status: random() > 0.1 ? TransactionStatus.Completed : TransactionStatus.Void,
        };

        if (ticket.status === TransactionStatus.Completed) {
            agent.ticketsSold++;
            agent.totalRevenue += price;
        }

        tickets.push(ticket);
    }
    return tickets;
};

const generateTransactions = async (tickets: Ticket[]): Promise<Transaction[]> => {
    let transactions: Transaction[] = [];
    let previousHash = '0'.repeat(64); // Genesis block

    const sortedTickets = tickets.sort((a,b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime());

    for (const ticket of sortedTickets) {
        if (ticket.status !== TransactionStatus.Completed) continue;

        const timestamp = new Date(ticket.travelDate);
        timestamp.setHours(timestamp.getHours() + Math.floor(random()*10));

        const id = `TXN-${timestamp.getTime()}`;
        const amount = ticket.price;
        const associatedRecordId = ticket.id;

        const hash = await calculateHash(id, timestamp.toISOString(), amount, associatedRecordId, previousHash);
        
        const transaction: Transaction = {
            id,
            type: 'Sale',
            amount,
            timestamp: timestamp.toISOString(),
            associatedRecordId,
            agentId: ticket.agentId,
            hash,
            previousHash,
        };
        transactions.push(transaction);
        previousHash = hash;

        // Occasionally add a fee transaction
        if (random() > 0.7) {
            const feeTimestamp = new Date(timestamp.getTime() + 1000*60*5);
            const feeId = `TXN-${feeTimestamp.getTime()}`;
            const feeAmount = parseFloat((ticket.price * 0.05).toFixed(2)); // 5% fee
            const feeHash = await calculateHash(feeId, feeTimestamp.toISOString(), feeAmount, ticket.id, previousHash);

            const feeTransaction: Transaction = {
                id: feeId,
                type: 'Fee',
                amount: feeAmount,
                timestamp: feeTimestamp.toISOString(),
                associatedRecordId: ticket.id,
                agentId: ticket.agentId,
                hash: feeHash,
                previousHash,
            };
            transactions.push(feeTransaction);
            previousHash = feeHash;
        }
    }
    return transactions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Newest first
};

const generateDiscrepancies = (count: number, transactions: Transaction[]): Discrepancy[] => {
    const discrepancies: Discrepancy[] = [];
    const types: Discrepancy['type'][] = ['Price Mismatch', 'Unaccounted Fee', 'Missing Deposit'];
    const statuses: DiscrepancyStatus[] = [DiscrepancyStatus.Resolved, DiscrepancyStatus.Pending, DiscrepancyStatus.ActionRequired];

    for (let i = 0; i < count; i++) {
        const transaction = transactions[Math.floor(random() * transactions.length)];
        const reportedAt = new Date(new Date(transaction.timestamp).getTime() + (random() * 1000 * 3600 * 24));
        
        const initialNote: Note = {
            id: `note-${Date.now()}`,
            content: 'System automatically flagged this discrepancy based on predefined rules.',
            author: 'System',
            timestamp: reportedAt.toISOString(),
        };

        discrepancies.push({
            id: `DIS-${Date.now() - i * 50000}`,
            type: types[Math.floor(random() * types.length)],
            details: `Investigation needed for transaction ${transaction.id}`,
            amount: parseFloat((random() * 100).toFixed(2)),
            associatedTransactionId: transaction.id,
            reportedAt: reportedAt.toISOString(),
            status: statuses[Math.floor(random() * statuses.length)],
            notes: [initialNote],
            assigneeId: undefined, // Can be assigned later
        });
    }
    return discrepancies;
};

const generateTasks = (count: number, discrepancies: Discrepancy[]): Task[] => {
    const tasks: Task[] = [];
    const statuses = Object.values(TaskStatus);
    const priorities = Object.values(TaskPriority);
    const assignees = ['user-auditor', 'user-finance', 'user-admin'];
    const titles = [
        'Review transaction logs for flight UG123',
        'Verify deposit slip against sales records',
        'Contact agent regarding price mismatch',
        'Reconcile daily sales report',
        'Follow up on unaccounted fee',
    ];

    for (let i = 0; i < count; i++) {
        const relatedDiscrepancy = random() > 0.5 ? discrepancies[Math.floor(random() * discrepancies.length)] : undefined;
        const createdAt = new Date(Date.now() - random() * 1000 * 3600 * 24 * 14); // Within last 2 weeks
        const dueDate = new Date(createdAt.getTime() + 1000 * 3600 * 24 * 7);

        tasks.push({
            id: `TASK-${Date.now() - i * 70000}`,
            title: relatedDiscrepancy ? `Investigate Discrepancy ${relatedDiscrepancy.id.substring(0,8)}...` : titles[i % titles.length],
            description: `Detailed investigation required for potential financial inconsistencies. Please review all associated documents.`,
            status: statuses[Math.floor(random() * statuses.length)],
            priority: priorities[Math.floor(random() * priorities.length)],
            assigneeId: assignees[Math.floor(random() * assignees.length)],
            createdAt: createdAt.toISOString(),
            dueDate: random() > 0.3 ? dueDate.toISOString().split('T')[0] : undefined,
            relatedDiscrepancyId: relatedDiscrepancy?.id,
        });
    }
    return tasks;
};

let cachedData: {
    agents: Agent[],
    tickets: Ticket[],
    transactions: Transaction[],
    discrepancies: Discrepancy[],
    tasks: Task[],
} | null = null;

// This function generates the initial data set.
// It's designed to run once and cache the results.
export const generateInitialData = () => {
    if (cachedData) {
        return cachedData;
    }

    const agents = generateAgents(5);
    const tickets = generateTickets(100, agents);
    
    // Transactions must be generated async due to hashing
    // We can't do this top-level, so we'll just mock hashes for initial sync load.
    let transactions: Transaction[] = [];
    let previousHash = '0'.repeat(64);
    const sortedTickets = tickets.sort((a,b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime());
    for (const ticket of sortedTickets) {
        if (ticket.status !== TransactionStatus.Completed) continue;
        const timestamp = new Date(ticket.travelDate);
        timestamp.setHours(timestamp.getHours() + Math.floor(random()*10));
        const id = `TXN-${timestamp.getTime()}`;
        const amount = ticket.price;
        const hash = `mockhash-${id}`;
        transactions.push({
            id, type: 'Sale', amount, timestamp: timestamp.toISOString(),
            associatedRecordId: ticket.id, agentId: ticket.agentId,
            hash, previousHash,
            fraudScore: Math.floor(random() * 60) + 5, // Score from 5 to 64
            fraudReason: 'Initial analysis based on typical transaction patterns. No significant anomalies detected.',
        });
        previousHash = hash;
    }
    transactions = transactions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Newest first


    const discrepancies = generateDiscrepancies(20, transactions);
    const tasks = generateTasks(15, discrepancies);

    cachedData = { agents, tickets, transactions, discrepancies, tasks };
    return cachedData;
};
