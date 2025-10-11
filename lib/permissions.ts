import { Permission } from '../types';

export const ALL_PERMISSIONS: { id: Permission; description: string; category: string }[] = [
    // General Access
    { id: 'view_dashboard', description: 'Can view the main dashboard', category: 'General' },
    { id: 'view_ticket_sales', description: 'Can view all ticket sales data', category: 'General' },
    { id: 'view_own_data_only', description: 'Restricts user to view only their own data (for Agents)', category: 'General' },

    // Auditing & Finance
    { id: 'view_agent_performance', description: 'Can view and monitor agent performance metrics', category: 'Auditing & Finance' },
    { id: 'manage_discrepancies', description: 'Can view, manage, and resolve discrepancies', category: 'Auditing & Finance' },
    { id: 'view_transaction_ledger', description: 'Can view the immutable transaction ledger', category: 'Auditing & Finance' },
    { id: 'generate_reports', description: 'Can generate and download system reports', category: 'Auditing & Finance' },
    { id: 'manage_tasks', description: 'Can create, assign, and manage tasks', category: 'Auditing & Finance' },

    // Administration
    { id: 'manage_users', description: 'Can create, edit, and delete user accounts', category: 'Administration' },
    { id: 'manage_roles', description: 'Can create, edit, and delete roles and permissions', category: 'Administration' },
    { id: 'manage_system_settings', description: 'Can modify system-wide settings', category: 'Administration' },
];

export const PERMISSION_CATEGORIES = ['General', 'Auditing & Finance', 'Administration'];
