import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

const Reports: React.FC = () => {
  const { tickets: mockTickets, agents: mockAgents, discrepancies: mockDiscrepancies, transactions: mockTransactions } = useData();

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

  const transactionTypes = useMemo(() => ['All', ...Array.from(new Set(mockTransactions.map(tx => tx.type)))], [mockTransactions]);


  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<{start: string, end: string}>>, field: 'start' | 'end', value: string) => {
    setter(prev => ({ ...prev, [field]: value }));
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data available for the selected filters.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          // Quote fields containing commas or quotes
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateTicketReport = () => {
    const startDate = new Date(ticketDates.start);
    const endDate = new Date(ticketDates.end);
    endDate.setHours(23, 59, 59, 999);

    const filteredData = mockTickets.filter(ticket => {
      const travelDate = new Date(ticket.travelDate);
      return travelDate >= startDate && travelDate <= endDate;
    });
    
    downloadCSV(filteredData, `ticket-sales_${ticketDates.start}_to_${ticketDates.end}.csv`);
  };

  const generateAgentReport = () => {
    const startDate = new Date(agentDates.start);
    const endDate = new Date(agentDates.end);
    endDate.setHours(23, 59, 59, 999);

    const salesInPeriod = mockTickets.filter(ticket => {
        const travelDate = new Date(ticket.travelDate);
        return travelDate >= startDate && travelDate <= endDate;
    });

    const agentReportData = mockAgents.map(agent => {
        const agentSales = salesInPeriod.filter(t => t.agentId === agent.id);
        return {
            agentId: agent.id,
            agentName: agent.name,
            ticketsSold: agentSales.length,
            totalRevenue: agentSales.reduce((sum, t) => sum + t.price, 0),
        };
    });

    downloadCSV(agentReportData, `agent-performance_${agentDates.start}_to_${agentDates.end}.csv`);
  };

  const generateDiscrepancyReport = () => {
    const startDate = new Date(discrepancyDates.start);
    const endDate = new Date(discrepancyDates.end);
    endDate.setHours(23, 59, 59, 999);

    const filteredData = mockDiscrepancies.filter(d => {
      const reportedDate = new Date(d.reportedAt);
      return reportedDate >= startDate && reportedDate <= endDate;
    });
    
    downloadCSV(filteredData, `discrepancies_${discrepancyDates.start}_to_${discrepancyDates.end}.csv`);
  };
  
  const generateLedgerReport = () => {
    const { type, agentId, start, end } = ledgerFilters;
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const filteredData = mockTransactions.filter(tx => {
      if (type !== 'All' && tx.type !== type) return false;
      if (agentId !== 'All' && tx.agentId !== agentId) return false;
      
      const txDate = new Date(tx.timestamp);
      if (txDate < startDate || txDate > endDate) return false;
      
      return true;
    });

    downloadCSV(filteredData, `transaction-ledger_${start}_to_${end}.csv`);
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
          <button onClick={generateTicketReport} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Generate & Download CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Agent Performance Report</h3>
        <div className="flex items-end space-x-4">
          <div>
            <label htmlFor="agent-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="agent-start-date" value={agentDates.start} onChange={e => handleDateChange(setAgentDates, 'start', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="agent-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" id="agent-end-date" value={agentDates.end} onChange={e => handleDateChange(setAgentDates, 'end', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <button onClick={generateAgentReport} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
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
          <button onClick={generateDiscrepancyReport} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
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
                  {mockAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button onClick={generateLedgerReport} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Generate & Download CSV
            </button>
        </div>
      </div>

    </div>
  );
};

export default Reports;