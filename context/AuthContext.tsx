import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { User, Role, Agent, Permission } from '../types';
import { generateInitialData } from '../lib/mockData';
import { ALL_PERMISSIONS } from '../lib/permissions';

type UserWithPassword = User & { password?: string };
type CurrentUser = User & { role: Role };

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  users: User[];
  roles: Role[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  addUser: (userData: Omit<User, 'id'> & { password?: string }) => void;
  updateUser: (userId: string, userData: Partial<Omit<User, 'id' | 'roleId'>> & { roleId?: string }) => void;
  deleteUser: (userId: string) => void;
  addRole: (roleData: Omit<Role, 'id'>) => void;
  updateRole: (roleId: string, roleData: Partial<Omit<Role, 'id'>>) => void;
  deleteRole: (roleId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const { agents } = generateInitialData();
const agentUserAgent = agents.find(a => a.id === 'UA-AG-001');

const initialRoles: Role[] = [
    { id: 'role-admin', name: 'Administrator', description: 'Has full system access.', permissions: ALL_PERMISSIONS.map(p => p.id), isDefault: true },
    { id: 'role-auditor', name: 'Auditor', description: 'Can view all data and manage discrepancies.', permissions: ['view_dashboard', 'view_ticket_sales', 'view_agent_performance', 'manage_discrepancies', 'view_transaction_ledger', 'generate_reports', 'manage_tasks'], isDefault: true },
    { id: 'role-finance', name: 'Finance Officer', description: 'Manages financial records and discrepancies.', permissions: ['view_dashboard', 'view_ticket_sales', 'manage_discrepancies', 'view_transaction_ledger', 'generate_reports', 'manage_tasks'], isDefault: true },
    { id: 'role-viewer', name: 'Viewer', description: 'Has read-only access to general reports.', permissions: ['view_dashboard', 'view_ticket_sales', 'generate_reports'], isDefault: true },
    { id: 'role-agent', name: 'Agent', description: 'Can only view their own sales data.', permissions: ['view_dashboard', 'view_ticket_sales', 'view_own_data_only'], isDefault: true },
];

const initialUsers: UserWithPassword[] = [
    { id: 'user-admin', username: 'admin', password: 'password', roleId: 'role-admin' },
    { id: 'user-agent1', username: 'agent', password: 'password', roleId: 'role-agent', agent: agentUserAgent },
    { id: 'user-viewer', username: 'viewer', password: 'password', roleId: 'role-viewer' },
    { id: 'user-finance', username: 'finance', password: 'password', roleId: 'role-finance' },
    { id: 'user-auditor', username: 'auditor', password: 'password', roleId: 'role-auditor' },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<UserWithPassword[]>(initialUsers);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('auditSysUser');
      if (storedUser) {
        const parsedUser: CurrentUser = JSON.parse(storedUser);
        // Ensure the role data is up-to-date from the main roles state
        const freshRole = roles.find(r => r.id === parsedUser.roleId);
        if (freshRole) {
          parsedUser.role = freshRole;
          setCurrentUser(parsedUser);
        }
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
        const role = roles.find(r => r.id === potentialUser?.roleId);

        if (potentialUser && potentialUser.password === password && role) {
            const { password, ...userBase } = potentialUser;
            const userToStore: CurrentUser = { ...userBase, role };
            localStorage.setItem('auditSysUser', JSON.stringify(userToStore));
            setCurrentUser(userToStore);
            resolve();
        } else {
            reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  }, [users, roles]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('auditSysUser');
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return currentUser?.role.permissions.includes(permission) ?? false;
  }, [currentUser]);

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
  
  const addRole = useCallback((roleData: Omit<Role, 'id'>) => {
      setRoles(prev => {
          if (prev.some(r => r.name.toLowerCase() === roleData.name.toLowerCase())) {
              throw new Error('A role with this name already exists.');
          }
          const newRole: Role = { id: `role-${Date.now()}`, ...roleData };
          return [...prev, newRole];
      });
  }, []);

  const updateRole = useCallback((roleId: string, roleData: Partial<Omit<Role, 'id'>>) => {
      setRoles(prev => {
          if (roleData.name && prev.some(r => r.name.toLowerCase() === roleData.name!.toLowerCase() && r.id !== roleId)) {
              throw new Error('A role with this name already exists.');
          }
          return prev.map(r => r.id === roleId ? { ...r, ...roleData } : r);
      });
  }, []);

  const deleteRole = useCallback((roleId: string) => {
      if (users.some(u => u.roleId === roleId)) {
          throw new Error('Cannot delete a role that is currently assigned to users.');
      }
      setRoles(prev => prev.filter(r => r.id !== roleId));
  }, [users]);


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
    roles,
    login,
    logout,
    hasPermission,
    addUser,
    updateUser,
    deleteUser,
    addRole,
    updateRole,
    deleteRole,
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
