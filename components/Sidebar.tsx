
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UgandanFlagIcon, DashboardIcon, TicketIcon, AgentIcon, AlertIcon, LedgerIcon, ReportsIcon, UsersIcon, SettingsIcon } from './ui/Icons';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const linkClasses = "flex items-center px-4 py-2.5 text-gray-300 hover:bg-primary-700 hover:text-white rounded-md transition-colors duration-200";
  const activeLinkClasses = "bg-primary-700 text-white";

  const hasAccess = (allowedRoles: Role[]) => {
    return role ? allowedRoles.includes(role) : false;
  }

  return (
    <div className="w-64 bg-primary-900 text-white flex flex-col">
      <div className="flex items-center justify-center h-20 border-b border-primary-800">
         <UgandanFlagIcon className="h-8 w-8 mr-3" />
        <h1 className="text-xl font-bold tracking-wider">AuditSys UG</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink to="/" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`} end>
          <DashboardIcon className="h-5 w-5 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
          <TicketIcon className="h-5 w-5 mr-3" />
          Ticket Sales
        </NavLink>
        
        {hasAccess(['Administrator', 'Auditor']) && (
            <NavLink to="/agents" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
              <AgentIcon className="h-5 w-5 mr-3" />
              Agent Performance
            </NavLink>
        )}
        {hasAccess(['Administrator', 'Auditor', 'Finance Officer']) && (
            <NavLink to="/discrepancies" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
              <AlertIcon className="h-5 w-5 mr-3" />
              Discrepancies
            </NavLink>
        )}
        {hasAccess(['Administrator', 'Auditor', 'Finance Officer', 'Viewer']) && (
            <NavLink to="/reports" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
              <ReportsIcon className="h-5 w-5 mr-3" />
              Reports
            </NavLink>
        )}
        {hasAccess(['Administrator', 'Auditor', 'Finance Officer']) && (
            <NavLink to="/ledger" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
              <LedgerIcon className="h-5 w-5 mr-3" />
              Transaction Ledger
            </NavLink>
        )}

        {hasAccess(['Administrator']) && (
          <div className="pt-4 mt-4 border-t border-primary-800">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</h3>
            <div className="mt-2 space-y-2">
                <NavLink to="/admin/users" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
                    <UsersIcon className="h-5 w-5 mr-3" />
                    Manage Users
                </NavLink>
                <NavLink to="/admin/settings" className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}>
                    <SettingsIcon className="h-5 w-5 mr-3" />
                    System Settings
                </NavLink>
            </div>
          </div>
        )}
      </nav>
      <div className="px-4 py-6 border-t border-primary-800">
        <p className="text-xs text-gray-400 text-center">© 2024 Republic of Uganda</p>
      </div>
    </div>
  );
};

export default Sidebar;