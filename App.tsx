
import React from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TicketSales from './components/TicketSales';
import AgentPerformance from './components/AgentPerformance';
import Discrepancies from './components/Discrepancies';
import TransactionLedger from './components/TransactionLedger';
import Reports from './components/Reports';
import Login from './components/Login';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';
import Profile from './components/Profile';
import ManageUsers from './components/admin/ManageUsers';
import SystemSettings from './components/admin/SystemSettings';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AlertIcon } from './components/ui/Icons';

const MaintenanceBanner = () => {
    const { settings } = useSettings();
    if (!settings.maintenanceMode) return null;

    return (
        <div className="bg-yellow-500 text-white text-center p-2 text-sm font-semibold flex items-center justify-center">
            <AlertIcon className="h-5 w-5 mr-2" />
            The system is currently in maintenance mode. Some features may be temporarily unavailable.
        </div>
    );
};

const AppContent: React.FC = () => {
  return (
    <DataProvider>
      <div className="flex h-screen bg-gray-100 text-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <MaintenanceBanner />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tickets" element={<TicketSales />} />
              <Route path="/agents" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Auditor']}>
                  <AgentPerformance />
                </ProtectedRoute>
              } />
              <Route path="/discrepancies" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Auditor', 'Finance Officer']}>
                  <Discrepancies />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Auditor', 'Finance Officer', 'Viewer']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/ledger" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Auditor', 'Finance Officer']}>
                  <TransactionLedger />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <ManageUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                    <SystemSettings />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </DataProvider>
  );
};

const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/*" element={isAuthenticated ? <AppContent /> : <Navigate to="/login" replace />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          <HashRouter>
              <AppRoutes />
          </HashRouter>
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
