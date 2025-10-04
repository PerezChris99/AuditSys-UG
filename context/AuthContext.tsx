import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { User, Role, Agent } from '../types';
import { generateInitialData } from '../lib/mockData';

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the initial agents from mock data to associate with users
const { agents } = generateInitialData();
const agentUserAgent = agents.find(a => a.id === 'UA-AG-001');

const mockUsers: Record<Role, User> = {
    Administrator: { id: 'user-admin', username: 'admin', role: 'Administrator' },
    Auditor: { id: 'user-auditor', username: 'auditor', role: 'Auditor' },
    'Finance Officer': { id: 'user-finance', username: 'finance', role: 'Finance Officer' },
    Agent: { id: 'user-agent1', username: 'agent1', role: 'Agent', agent: agentUserAgent },
    Viewer: { id: 'user-viewer', username: 'viewer', role: 'Viewer' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('Administrator');

  const user = useMemo(() => mockUsers[role], [role]);

  const value = { 
    user, 
    role, 
    setRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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