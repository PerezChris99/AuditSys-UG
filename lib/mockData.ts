
import { Agent, Ticket, Transaction, Discrepancy, TransactionStatus, DiscrepancyStatus } from '../types';
import { calculateHash } from './cryptoUtils';

const AGENT_NAMES = ['Amina Okoro', 'David Kato', 'Grace Nakato', 'Samuel Bwire', 'Esther Nabirye'];
const CITIES = ['EBB', 'JNB', 'NBO', 'KGL', 'DAR'];

// Generate Agents
export const mockAgents: Agent[] = AGENT_NAMES.map((name, index) => ({
  id: `AGT-${1001 + index}`,
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@auditsys.ug`,
  avatarUrl: `https://i.pravatar.cc/40?u=agent${index}`,
  ticketsSold: Math.floor(Math.random() * 200) + 50,
  totalRevenue: Math.floor(Math.random() * 150000) + 50000,
  accuracy: parseFloat((Math.random() * (100 - 95) + 95).toFixed(2)),
  disputeRate: parseFloat((Math.random() * 5).toFixed(2)),
}));

// Generate Tickets
export const mockTickets: Ticket[] = Array.from({ length: 100 }, (_, i) => {
  const agent = mockAgents[i % mockAgents.length];
  const origin = CITIES[Math.floor(Math.random() * CITIES.length)];
  let destination = CITIES[Math.floor(Math.random() * CITIES.length)];
  while (destination === origin) {
    destination = CITIES[Math.floor(Math.random() * CITIES.length)];
  }
  const travelDate = new Date();
  travelDate.setDate(travelDate.getDate() + Math.floor(Math.random() * 30));

  const statusValues = Object.values(TransactionStatus);
  const status = statusValues[Math.floor(Math.random() * statusValues.length)];

  return {
    id: `TCK-${7000 + i}`,
    passengerName: `Passenger ${i + 1}`,
    flightNumber: `UG${Math.floor(Math.random() * 500) + 100}`,
    origin,
    destination,
    travelDate: travelDate.toISOString().split('T')[0],
    price: Math.floor(Math.random() * 800) + 200,
    agentId: agent.id,
    status,
  };
});

// Generate Transactions (Immutable Ledger)
let previousHash = '0'.repeat(16);
export const mockTransactions: Transaction[] = mockTickets.map((ticket, i) => {
  const agent = mockAgents.find(a => a.id === ticket.agentId)!;
  const timestamp = new Date();
  timestamp.setHours(timestamp.getHours() - (100 - i));

  const transactionData = {
    id: `TRN-${90000 + i}`,
    type: 'Sale' as const,
    amount: ticket.price,
    timestamp: timestamp.toISOString(),
    associatedRecordId: ticket.id,
    agentId: agent.id,
  };

  const currentHash = calculateHash(transactionData);
  
  const transaction: Transaction = {
    ...transactionData,
    hash: currentHash,
    previousHash: previousHash,
  };

  previousHash = currentHash;
  return transaction;
}).reverse(); // Show newest first

// Generate Discrepancies
export const mockDiscrepancies: Discrepancy[] = Array.from({ length: 15 }, (_, i) => {
  const ticket = mockTickets[Math.floor(Math.random() * mockTickets.length)];
  const discrepancyTypes = ['Price Mismatch', 'Unaccounted Fee', 'Missing Deposit'];
  const statusValues = Object.values(DiscrepancyStatus);

  const reportedAt = new Date();
  reportedAt.setDate(reportedAt.getDate() - Math.floor(Math.random() * 10));

  return {
    id: `DIS-${500 + i}`,
    type: discrepancyTypes[Math.floor(Math.random() * discrepancyTypes.length)] as 'Price Mismatch' | 'Unaccounted Fee' | 'Missing Deposit',
    details: `Mismatch found for ticket ${ticket.id}. Expected value differs from recorded.`,
    amount: parseFloat(((Math.random() * 200) + 10).toFixed(2)),
    associatedTransactionId: `TRN-${90000 + mockTickets.indexOf(ticket)}`,
    reportedAt: reportedAt.toISOString(),
    status: statusValues[Math.floor(Math.random() * statusValues.length)],
  };
});