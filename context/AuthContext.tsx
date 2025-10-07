
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { User, Role, Agent } from '../types';
import { generateInitialData } from '../lib/mockData';

// This internal type includes the password, which should not be exposed to the rest of the app.
type UserWithPassword = User & { password?: string };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  users: User[]; // Expose all users for the admin panel
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  addUser: (userData: Omit<User, 'id'> & { password?: string }) => void;
  updateUser: (userId: string, userData: Partial<Omit<User, 'id'>>) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const { agents } = generateInitialData();
const agentUserAgent = agents.find(a => a.id === 'UA-AG-001');

const initialUsers: UserWithPassword[] = [
    { id: 'user-admin', username: 'admin', password: 'password', role: 'Administrator' },
    { id: 'user-agent1', username: 'agent', password: 'password', role: 'Agent', agent: agentUserAgent },
    { id: 'user-viewer', username: 'viewer', password: 'password', role: 'Viewer' },
    { id: 'user-finance', username: 'finance', password: 'password', role: 'Finance Officer' },
    { id: 'user-auditor', username: 'auditor', password: 'password', role: 'Auditor' },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserWithPassword[]>(initialUsers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auditSysUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
        setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const potentialUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (potentialUser && potentialUser.password === password) {
            const { password, ...userToStore } = potentialUser;
            localStorage.setItem('auditSysUser', JSON.stringify(userToStore));
            setCurrentUser(userToStore);
            resolve();
        } else {
            reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('auditSysUser');
  }, []);

  const addUser = useCallback((userData: Omit<User, 'id'> & { password?: string }) => {
      setUsers(prev => {
          if (prev.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
              throw new Error('Username already exists.');
          }
          const newUser: UserWithPassword = {
              id: `user-${Date.now()}`,
              ...userData,
          };
          return [...prev, newUser];
      });
  }, []);

  const updateUser = useCallback((userId: string, userData: Partial<Omit<User, 'id'>>) => {
      setUsers(prev => {
          if (userData.username && prev.some(u => u.username.toLowerCase() === userData.username!.toLowerCase() && u.id !== userId)) {
              throw new Error('Username already exists.');
          }
          return prev.map(u => u.id === userId ? { ...u, ...userData } : u);
      });
  }, []);

  const deleteUser = useCallback((userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const publicUsers = useMemo(() => {
      return users.map(u => {
          const { password, ...publicUser } = u;
          return publicUser;
      });
  }, [users]);

  const value = { 
    user: currentUser, 
    isAuthenticated: !!currentUser,
    users: publicUsers,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
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
