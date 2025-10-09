import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Agent, Ticket, Transaction, Discrepancy, Role, User, DiscrepancyStatus, Note } from '../types';
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
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  updateDiscrepancy: (id: string, updatedDiscrepancy: Discrepancy) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const {
  agents: initialAgents,
  tickets: initialTickets,
  transactions: initialTransactions,
  discrepancies: initialDiscrepancies,
} = generateInitialData();

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>(initialDiscrepancies);
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { settings } = useSettings();

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

  useEffect(() => {
    const interval = setInterval(() => {
      (async () => {
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
      })();
    }, settings.simulationInterval);

    return () => clearInterval(interval);
  }, [addNotification, agents, transactions, settings.simulationInterval, settings.transactionThreshold]);

  // Filter data based on user role
  const getFilteredData = useCallback(() => {
    if (user?.role !== 'Agent' || !user.agent) {
      return {
        agents,
        tickets,
        transactions,
        discrepancies,
      };
    }
    
    const agentId = user.agent.id;
    const agentTickets = tickets.filter(t => t.agentId === agentId);
    const agentTransactions = transactions.filter(t => t.agentId === agentId);
    const agentDiscrepancies = discrepancies.filter(d => agentTransactions.some(t => t.id === d.associatedTransactionId));

    return {
      agents, // Still need all agents for lookups
      tickets: agentTickets,
      transactions: agentTransactions,
      discrepancies: agentDiscrepancies,
    };
  }, [user, agents, tickets, transactions, discrepancies]);

  const value = { ...getFilteredData(), setTransactions, updateDiscrepancy };

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