import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TicketSales from './components/TicketSales';
import AgentPerformance from './components/AgentPerformance';
import Discrepancies from './components/Discrepancies';
import TransactionLedger from './components/TransactionLedger';
import Reports from './components/Reports';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';

const AppContent: React.FC = () => {
  const { isLoading, error } = useData();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-xl font-semibold">Loading Auditing System...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600 bg-red-50 p-4">
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
            <p className="max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-100 text-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tickets" element={<TicketSales />} />
              <Route path="/agents" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <AgentPerformance />
                </ProtectedRoute>
              } />
              <Route path="/discrepancies" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <Discrepancies />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/ledger" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <TransactionLedger />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
