import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { User, Role, Agent } from '../types';
import { generateInitialData } from '../lib/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the initial agents from mock data to associate with users
const { agents } = generateInitialData();
const agentUserAgent = agents.find(a => a.id === 'UA-AG-001');

const mockUsers: Record<string, Omit<User, 'role'> & {password: string, role: Role}> = {
    admin: { id: 'user-admin', username: 'admin', password: 'password', role: 'Administrator' },
    agent: { id: 'user-agent1', username: 'agent', password: 'password', role: 'Agent', agent: agentUserAgent },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auditSysUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
        setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    // In a real app, this would be an API call:
    // const response = await fetch('http://127.0.0.1:5000/api/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password })
    // });
    // if (!response.ok) throw new Error('Login failed');
    // const { user, token } = await response.json();
    // localStorage.setItem('auditSysToken', token);

    // Mocking the API call for now
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const potentialUser = mockUsers[username.toLowerCase()];
        if (potentialUser && potentialUser.password === password) {
            const { password, ...userToStore } = potentialUser;
            localStorage.setItem('auditSysUser', JSON.stringify(userToStore));
            setUser(userToStore);
            resolve();
        } else {
            reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auditSysUser');
    // In a real app with tokens:
    // localStorage.removeItem('auditSysToken');
  }, []);

  const value = { 
    user, 
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
