import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Agent, Ticket, Transaction, Discrepancy } from '../types';
import { mockAgents, mockTickets, mockTransactions, mockDiscrepancies } from '../lib/mockData';
import { generateNewLiveData } from '../lib/dataGenerator';
import { useNotifications } from './NotificationContext';

interface DataContextType {
  agents: Agent[];
  tickets: Ticket[];
  transactions: Transaction[];
  discrepancies: Discrepancy[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agents] = useState<Agent[]>(mockAgents);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>(mockDiscrepancies);
  const { addNotification } = useNotifications();

  const ticketsRef = useRef(tickets);
  const transactionsRef = useRef(transactions);
  const discrepanciesRef = useRef(discrepancies);

  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);
  
  useEffect(() => {
    discrepanciesRef.current = discrepancies;
  }, [discrepancies]);

  useEffect(() => {
    const interval = setInterval(() => {
      const { newTicket, newTransaction, newDiscrepancy } = generateNewLiveData(
        agents,
        ticketsRef.current,
        transactionsRef.current,
        discrepanciesRef.current.length
      );
      
      setTickets(prev => [newTicket, ...prev]);
      setTransactions(prev => [newTransaction, ...prev]);
      
      if (newDiscrepancy) {
        setDiscrepancies(prev => [newDiscrepancy, ...prev]);
        addNotification({
          message: `New high-priority discrepancy #${newDiscrepancy.id} flagged.`,
          type: 'Discrepancy',
          link: '/discrepancies',
        });
      }
      
      if (newTransaction.amount > 1000) {
        addNotification({
          message: `Significant transaction #${newTransaction.id} for $${newTransaction.amount.toFixed(2)}.`,
          type: 'Transaction Anomaly',
          link: '/ledger',
        });
      }

    }, 5000);

    return () => clearInterval(interval);
  }, [agents, addNotification]);

  const value = { agents, tickets, transactions, discrepancies };

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
