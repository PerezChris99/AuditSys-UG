export enum TransactionStatus {
  Completed = 'Completed',
  Pending = 'Pending',
  Void = 'Void',
}

export enum DiscrepancyStatus {
  Resolved = 'Resolved',
  Pending = 'Pending Investigation',
  ActionRequired = 'Action Required',
}

export interface Agent {
  id: string;
  name: string;
  avatarUrl: string;
  ticketsSold: number;
  totalRevenue: number;
  accuracy: number;
  disputeRate: number;
  email: string;
}

export interface Ticket {
  id: string;
  passengerName: string;
  flightNumber: string;
  origin: string;
  destination: string;
  travelDate: string;
  price: number;
  agentId: string;
  status: TransactionStatus;
}

export interface Transaction {
  id: string;
  type: 'Sale' | 'Fee' | 'Refund' | 'Reconciliation';
  amount: number;
  timestamp: string;
  associatedRecordId: string; // e.g., Ticket ID
  agentId: string;
  hash: string;
  previousHash: string;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

export interface Discrepancy {
  id: string;
  type: 'Price Mismatch' | 'Unaccounted Fee' | 'Missing Deposit';
  details: string;
  amount: number;
  associatedTransactionId: string;
  reportedAt: string;
  status: DiscrepancyStatus;
  assigneeId?: string;
  notes?: Note[];
}

export type Role = 'Administrator' | 'Viewer' | 'Auditor' | 'Finance Officer' | 'Agent';

export interface User {
  id: string;
  username: string;
  role: Role;
  agent?: Agent;
}

export interface Notification {
  id: string;
  message: string;
  type: 'Discrepancy' | 'Transaction Anomaly';
  timestamp: string;
  isRead: boolean;
  link: string;
}