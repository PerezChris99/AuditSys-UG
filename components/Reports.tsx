


import React, { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DiscrepancyStatus } from '../types';

const Reports: React.FC = () => {
  const { agents, tickets, discrepancies, transactions } = useData();
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];
  
  const [ticketDates, setTicketDates] = useState({ start: lastMonthStr, end: today });
  const [discrepancyDates, setDiscrepancyDates] = useState({ start: lastMonthStr, end: today });
  const [ledgerFilters, setLedgerFilters] = useState({
    type: 'All',
    agentId: 'All',
    start: lastMonthStr,
    end: today,
  });

  // FIX: This comparison appears to be unintentional because the types 'Role' and 'string' have no overlap.
  const canSeeAgentReports = useMemo(() => {
    if (!user) return false;
    return ['Administrator', 'Auditor', 'Viewer'].includes(user.role.name);
  }, [user]);

  const transactionTypes = useMemo(() => ['All', ...Array.from(new Set(transactions.map(tx => tx.type)))], [transactions]);

  const handleDateChange = (setter: React.Dispatch<React.SetStateAction<{start: string, end: string}>>, field: 'start' | 'end', value: string) => {
    setter(prev => ({ ...prev, [field]: value }));
  };

  // Data processing for charts
  const ticketSalesData = useMemo(() => {
    const filtered = tickets.filter(t => {
      const date = new Date(t.travelDate);
      const start = new Date(ticketDates.start);
      start.setHours(0,0,0,0);
      const end = new Date(ticketDates.end);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });

    const dailyData = filtered.reduce((acc, ticket) => {
        const date = ticket.travelDate;
        acc[date] = (acc[date] || 0) + ticket.price;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyData)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tickets, ticketDates]);

  const discrepancyStatusData = useMemo(() => {
    const filtered = discrepancies.filter(d => {
      const date = new Date(d.reportedAt);
      const start = new Date(discrepancyDates.start);
      start.setHours(0,0,0,0);
      const end = new Date(discrepancyDates.end);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
    
    const statusCounts = filtered.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as { [key in DiscrepancyStatus]?: number });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value: value || 0 }));
  }, [discrepancies, discrepancyDates]);
  
  const COLORS: {[key: string]: string} = {
    [DiscrepancyStatus.Resolved]: '#3b82f6',
    [DiscrepancyStatus.Pending]: '#f59e0b',
    [DiscrepancyStatus.ActionRequired]: '#ef4444',
  };

  const agentPerformanceData = useMemo(() => {
    return agents
      .map(agent => ({
        name: agent.name.split(' ')[0],
        revenue: agent.totalRevenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [agents]);


  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data available for the selected criteria.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTicketReport = () => {
    const filtered = tickets.filter(t => {
      const date = new Date(t.travelDate);
      const start = new Date(ticketDates.start);
      const end = new Date(ticketDates.end);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
    downloadCSV(filtered, `ticket_sales_${ticketDates.start}_to_${ticketDates.end}.csv`);
  };

  const generateAgentReport = () => {
    downloadCSV(agents, 'agent_performance.csv');
  };

  const generateDiscrepancyReport = () => {
    const filtered = discrepancies.filter(d => {
      const date = new Date(d.reportedAt);
      const start = new Date(discrepancyDates.start);
      const end = new Date(discrepancyDates.end);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
    downloadCSV(filtered, `discrepancies_${discrepancyDates.start}_to_${discrepancyDates.end}.csv`);
  };

  const generateLedgerReport = () => {
    const filtered = transactions.filter(tx => {
      if (ledgerFilters.type !== 'All' && tx.type !== ledgerFilters.type) return false;
      if (ledgerFilters.agentId !== 'All' && tx.agentId !== ledgerFilters.agentId) return false;
      const txDate = new Date(tx.timestamp);
      const start = new Date(ledgerFilters.start);
      const end = new Date(ledgerFilters.end);
      end.setHours(23, 59, 59, 999);
      if (ledgerFilters.start && start > txDate) return false;
      if (ledgerFilters.end && end < txDate) return false;
      return true;
    });
    downloadCSV(filtered, `ledger_report_${ledgerFilters.start}_to_${ledgerFilters.end}.csv`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
                  <p className="label font-bold">{`${label}`}</p>
                  <p className="intro text-primary-600">{`Revenue : $${payload[0].value.toLocaleString()}`}</p>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Ticket Sales Report</h3>
        <div className="h-80 w-full mb-6">
            <ResponsiveContainer>
                {ticketSalesData.length > 0 ? (
                    <LineChart data={ticketSalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#1d4ed8" strokeWidth={2} activeDot={{ r: 8 }} name="Daily Revenue" />
                    </LineChart>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No data available for selected date range.</div>
                )}
            </ResponsiveContainer>
        </div>
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
            Download CSV
          </button>
        </div>
      </div>

      {canSeeAgentReports && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Agent Performance Report</h3>
            <div className="h-80 w-full mb-6">
                <ResponsiveContainer>
                    {agentPerformanceData.length > 0 ? (
                        <BarChart data={agentPerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                            <YAxis dataKey="name" type="category" width={80} />
                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#2563eb" name="Total Revenue" />
                        </BarChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">No agent data available.</div>
                    )}
                </ResponsiveContainer>
            </div>
          <p className="text-sm text-gray-500 mb-4">This report provides a snapshot of current agent statistics.</p>
          <div className="flex items-end space-x-4">
            <button onClick={generateAgentReport} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Download CSV
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Discrepancies Report</h3>
        <div className="h-80 w-full mb-6 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                {discrepancyStatusData.length > 0 ? (
                    <PieChart>
                        <Pie
                            data={discrepancyStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            // FIX: Corrected the type of the label function parameter to `any` to resolve type incompatibility with recharts. The library's type definitions seem to be missing the 'percent' property.
                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {discrepancyStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Legend />
                    </PieChart>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No data available for selected date range.</div>
                )}
            </ResponsiveContainer>
        </div>
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
            Download CSV
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
            <button onClick={generateLedgerReport} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Download CSV
            </button>
        </div>
      </div>

    </div>
  );
};

export default Reports;
