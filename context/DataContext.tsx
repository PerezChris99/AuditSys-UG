
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Agent, Ticket, Transaction, Discrepancy, Role, User, DiscrepancyStatus, Note, Task, TaskStatus } from '../types';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { generateInitialData } from '../lib/mockData';
import { generateNewTicket, generateNewTransaction } from '../lib/dataGenerator';
import { useSettings } from './SettingsContext';

interface DataContextType {
  agents: Agent[];
  tickets: Ticket[];
  transactions: Transaction[];
  discrepancies: Discrepancy[];
  tasks: Task[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  updateDiscrepancy: (id: string, updatedDiscrepancy: Discrepancy) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  generateDataPoint: () => Promise<void>;
  isTaskModalOpen: boolean;
  openTaskModal: (initialData?: Partial<Task>) => void;
  closeTaskModal: () => void;
  taskInitialData: Partial<Task> | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const {
  agents: initialAgents,
  tickets: initialTickets,
  transactions: initialTransactions,
  discrepancies: initialDiscrepancies,
  tasks: initialTasks,
} = generateInitialData();

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>(initialDiscrepancies);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { settings } = useSettings();

  // Task Modal State
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [taskInitialData, setTaskInitialData] = useState<Partial<Task> | null>(null);

  const openTaskModal = (initialData?: Partial<Task>) => {
    setTaskInitialData(initialData || null);
    setTaskModalOpen(true);
  };
  const closeTaskModal = () => {
    setTaskInitialData(null);
    setTaskModalOpen(false);
  };


  const updateDiscrepancy = useCallback((id: string, updatedDiscrepancy: Discrepancy) => {
    const isValidStatus = Object.values(DiscrepancyStatus).includes(updatedDiscrepancy.status);
    if (!isValidStatus) {
        throw new Error(`Invalid status provided for discrepancy.`);
    }
    setDiscrepancies(prev => {
        const index = prev.findIndex(d => d.id === id);
        if (index === -1) {
            throw new Error(`Discrepancy with id ${id} not found.`);
        }
        const newDiscrepancies = [...prev];
        newDiscrepancies[index] = updatedDiscrepancy;
        return newDiscrepancies;
    });
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
        ...taskData,
        id: `TASK-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: taskData.status || TaskStatus.ToDo,
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
      setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
      ));
  }, []);

  const generateDataPoint = useCallback(async () => {
    const newTicket = generateNewTicket(agents);
    const agent = agents.find(a => a.id === newTicket.agentId);

    if (!agent) return;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentTransactions = transactions.filter(t => t.timestamp > oneDayAgo);

    const newTransaction = await generateNewTransaction(
        newTicket, 
        transactions[0]?.hash || '0'.repeat(64),
        agent,
        recentTransactions
    );
    
    setTickets(prev => [newTicket, ...prev]);
    setTransactions(prev => [newTransaction, ...prev]);

    if (newTransaction.amount > settings.transactionThreshold) {
        addNotification({
          message: `Significant transaction #${newTransaction.id} for $${newTransaction.amount.toFixed(2)}.`,
          type: 'Transaction Anomaly',
          link: '/ledger',
        });
    }

    if (newTransaction.fraudScore && newTransaction.fraudScore > 75) {
         addNotification({
          message: `High fraud risk transaction (${newTransaction.fraudScore}) flagged for TXN #${newTransaction.id}.`,
          type: 'High Fraud Risk',
          link: '/ledger',
        });
    }
    
    if (Math.random() < 0.1) { // 10% chance to create a discrepancy
      const newDiscrepancy: Discrepancy = {
        id: `DIS-${Date.now()}`,
        type: 'Unaccounted Fee',
        details: `Unaccounted fee related to transaction ${newTransaction.id}`,
        amount: Math.floor(Math.random() * 50) + 10,
        associatedTransactionId: newTransaction.id,
        reportedAt: new Date().toISOString(),
        status: DiscrepancyStatus.ActionRequired,
        notes: [{
            id: `note-${Date.now()}`,
            content: 'System automatically flagged this discrepancy.',
            author: 'System',
            timestamp: new Date().toISOString(),
        }]
      };
      setDiscrepancies(prev => [newDiscrepancy, ...prev]);
      addNotification({
          message: `New high-priority discrepancy #${newDiscrepancy.id} flagged.`,
          type: 'Discrepancy',
          link: '/discrepancies',
      });
    }
  }, [addNotification, agents, transactions, settings.transactionThreshold]);

  useEffect(() => {
    const interval = setInterval(() => {
      generateDataPoint();
    }, settings.simulationInterval);

    return () => clearInterval(interval);
  }, [settings.simulationInterval, generateDataPoint]);

  // Filter data based on user role
  const getFilteredData = useCallback(() => {
    // FIX: This comparison appears to be unintentional because the types 'Role' and 'string' have no overlap.
    if (user?.role.name !== 'Agent' || !user.agent) {
      return {
        agents,
        tickets,
        transactions,
        discrepancies,
        tasks,
      };
    }
    
    const agentId = user.agent.id;
    const agentTickets = tickets.filter(t => t.agentId === agentId);
    const agentTransactions = transactions.filter(t => t.agentId === agentId);
    const agentDiscrepancies = discrepancies.filter(d => agentTransactions.some(t => t.id === d.associatedTransactionId));
    
    // Agents don't see tasks
    const userTasks = tasks.filter(t => t.assigneeId === user.id);


    return {
      agents, // Still need all agents for lookups
      tickets: agentTickets,
      transactions: agentTransactions,
      discrepancies: agentDiscrepancies,
      tasks, // Return all tasks for now, filtering will happen on the page
    };
  }, [user, agents, tickets, transactions, discrepancies, tasks]);

  const value = { 
    ...getFilteredData(), 
    setTransactions, 
    updateDiscrepancy, 
    generateDataPoint,
    addTask,
    updateTask,
    isTaskModalOpen,
    openTaskModal,
    closeTaskModal,
    taskInitialData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
