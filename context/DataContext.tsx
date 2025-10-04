import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Agent, Ticket, Transaction, Discrepancy } from '../types';
import { useNotifications } from './NotificationContext';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

interface DataContextType {
  agents: Agent[];
  tickets: Ticket[];
  transactions: Transaction[];
  discrepancies: Discrepancy[];
  isLoading: boolean;
  error: string | null;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addNotification } = useNotifications();

  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/data`);
      if (!response.ok) {
        let errorMsg = `The server responded with status: ${response.status}`;
        try {
            const errorJson = await response.json();
            if (errorJson && errorJson.error) {
                errorMsg = errorJson.error;
            }
        } catch (e) {
            // The error response wasn't JSON, use status text as a fallback
            errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setAgents(data.agents);
      setTickets(data.tickets);
      setTransactions(data.transactions);
      setDiscrepancies(data.discrepancies);
    } catch (e: any) {
      setError(`Failed to connect to the auditing system. Please ensure the backend server is running and accessible. Details: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/poll`);
        if (!response.ok) {
          console.error(`Polling failed with status: ${response.status}`);
          return;
        }
        const newData = await response.json();

        if (newData.tickets.length > 0) {
          setTickets(prev => [...newData.tickets, ...prev]);
        }
        if (newData.transactions.length > 0) {
          setTransactions(prev => [...newData.transactions, ...prev]);
           newData.transactions.forEach((tx: Transaction) => {
            if (tx.amount > 1000) {
              addNotification({
                message: `Significant transaction #${tx.id} for $${tx.amount.toFixed(2)}.`,
                type: 'Transaction Anomaly',
                link: '/ledger',
              });
            }
          });
        }
        if (newData.discrepancies.length > 0) {
          setDiscrepancies(prev => [...newData.discrepancies, ...prev]);
          newData.discrepancies.forEach((d: Discrepancy) => {
            addNotification({
                message: `New high-priority discrepancy #${d.id} flagged.`,
                type: 'Discrepancy',
                link: '/discrepancies',
            });
          });
        }
        
      } catch (e) {
        // Silently fail on poll error to avoid console spam if server is down
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [addNotification]);


  const value = { agents, tickets, transactions, discrepancies, isLoading, error, setTransactions };

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
