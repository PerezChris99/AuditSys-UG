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

const AppContent: React.FC = () => {
  return (
    <DataProvider>
      <div className="flex h-screen bg-gray-100 text-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
                <ProtectedRoute allowedRoles={['Administrator', 'Auditor', 'Finance Officer']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/ledger" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Auditor', 'Finance Officer']}>
                  <TransactionLedger />
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
      <NotificationProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
