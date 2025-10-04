import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const Reports: React.FC = () => {
  const { agents, transactions } = useData();

  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];
  
  const [ticketDates, setTicketDates] = useState({ start: lastMonthStr, end: today });
  const [agentDates, setAgentDates] = useState({ start: lastMonthStr, end: today });
  const [discrepancyDates, setDiscrepancyDates] = useState({ start: lastMonthStr, end: today });
  const [ledgerFilters, setLedgerFilters] = useState({
    type: 'All',
    agentId: 'All',
    start: lastMonthStr,
    end: today,
  });

  const transactionTypes = useMemo(() => ['All', ...Array.from(new Set(transactions.map(tx => tx.type)))], [transactions]);

  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<{start: string, end: string}>>, field: 'start' | 'end', value: string) => {
    setter(prev => ({ ...prev, [field]: value }));
  };
  
  const generateReport = async (reportType: string, params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/reports/${reportType}?${query}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorMsg = `Report generation failed (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) { /* response was not json */ }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    } catch (error: any) {
      alert(`Could not download report: ${error.message}`);
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Ticket Sales Report</h3>
        <div className="flex items-end space-x-4">
          <div>
            <label htmlFor="ticket-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="ticket-start-date" value={ticketDates.start} onChange={e => handleDateChange(setTicketDates, 'start', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="ticket-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" id="ticket-end-date" value={ticketDates.end} onChange={e => handleDateChange(setTicketDates, 'end', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <button onClick={() => generateReport('tickets', ticketDates)} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Generate & Download CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Agent Performance Report</h3>
        <p className="text-sm text-gray-500 mb-4">This report provides a snapshot of current agent statistics.</p>
        <div className="flex items-end space-x-4">
          <button onClick={() => generateReport('agents', {})} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Generate & Download CSV
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Discrepancies Report</h3>
        <div className="flex items-end space-x-4">
          <div>
            <label htmlFor="discrepancy-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="discrepancy-start-date" value={discrepancyDates.start} onChange={e => handleDateChange(setDiscrepancyDates, 'start', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="discrepancy-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" id="discrepancy-end-date" value={discrepancyDates.end} onChange={e => handleDateChange(setDiscrepancyDates, 'end', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <button onClick={() => generateReport('discrepancies', discrepancyDates)} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Generate & Download CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Transaction Ledger Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div>
                <label htmlFor="ledger-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" id="ledger-start-date" value={ledgerFilters.start} onChange={e => setLedgerFilters(p => ({ ...p, start: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="ledger-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" id="ledger-end-date" value={ledgerFilters.end} onChange={e => setLedgerFilters(p => ({ ...p, end: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="ledger-tx-type" className="block text-sm font-medium text-gray-700">Transaction Type</label>
              <select id="ledger-tx-type" value={ledgerFilters.type} onChange={e => setLedgerFilters(p => ({ ...p, type: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  {transactionTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ledger-agent" className="block text-sm font-medium text-gray-700">Agent</label>
              <select id="ledger-agent" value={ledgerFilters.agentId} onChange={e => setLedgerFilters(p => ({ ...p, agentId: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="All">All Agents</option>
                  {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button onClick={() => generateReport('ledger', ledgerFilters)} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Generate & Download CSV
            </button>
        </div>
      </div>

    </div>
  );
};

export default Reports;