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

export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export type Permission =
  | 'view_dashboard'
  | 'view_ticket_sales'
  | 'view_agent_performance'
  | 'manage_discrepancies'
  | 'view_transaction_ledger'
  | 'generate_reports'
  | 'manage_tasks'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_system_settings'
  | 'view_own_data_only';

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    isDefault?: boolean; // To prevent deletion of core roles
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
  fraudScore?: number;
  fraudReason?: string;
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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string; // User ID
  dueDate?: string;
  relatedDiscrepancyId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  roleId: string;
  agent?: Agent;
}

export interface Notification {
  id: string;
  message: string;
  type: 'Discrepancy' | 'Transaction Anomaly' | 'High Fraud Risk';
  timestamp: string;
  isRead: boolean;
  link: string;
}
