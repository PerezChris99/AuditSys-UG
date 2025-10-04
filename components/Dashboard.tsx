
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useData } from '../context/DataContext';
import { DiscrepancyStatus } from '../types';
import Card from './ui/Card';
import { DollarSignIcon, TicketIcon, AgentIcon, AlertIcon } from './ui/Icons';

const Dashboard: React.FC = () => {
  const { agents: mockAgents, tickets: mockTickets, discrepancies: mockDiscrepancies } = useData();
  
  const totalRevenue = mockTickets.reduce((acc, ticket) => acc + ticket.price, 0);
  const totalTickets = mockTickets.length;
  const totalAgents = mockAgents.length;
  const pendingDiscrepancies = mockDiscrepancies.filter(d => d.status.includes('Pending')).length;

  const salesData = mockTickets
    .sort((a, b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime())
    .reduce((acc, ticket) => {
      const date = ticket.travelDate.substring(5, 10); // MM-DD
      const existing = acc.find(item => item.name === date);
      if (existing) {
        existing.revenue += ticket.price;
      } else {
        acc.push({ name: date, revenue: ticket.price });
      }
      return acc;
    }, [] as { name: string, revenue: number }[]).slice(-30);

  const agentPerformanceData = mockAgents.map(agent => ({
    name: agent.name.split(' ')[0],
    revenue: agent.totalRevenue,
    tickets: agent.ticketsSold,
  }));

  // FIX: Corrected the type definition for the reduce accumulator. A mapped type cannot be
  // declared alongside other properties in a type literal. Using an intersection type `&`
  // correctly combines `{ date: string }` and `{[key in DiscrepancyStatus]: number}`.
  const discrepancyStatusData = mockDiscrepancies
    .reduce((acc, discrepancy) => {
      const date = new Date(discrepancy.reportedAt).toISOString().split('T')[0].substring(5, 10); // MM-DD
      let dateEntry = acc.find(item => item.date === date);

      if (!dateEntry) {
          dateEntry = { 
              date,
              [DiscrepancyStatus.Resolved]: 0,
              [DiscrepancyStatus.Pending]: 0,
              [DiscrepancyStatus.ActionRequired]: 0,
          };
          acc.push(dateEntry);
      }

      dateEntry[discrepancy.status]++;
      return acc;
    }, [] as Array<{ date: string } & { [key in DiscrepancyStatus]: number }>)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSignIcon />} />
        <Card title="Tickets Sold" value={totalTickets.toLocaleString()} icon={<TicketIcon />} />
        <Card title="Active Agents" value={totalAgents.toLocaleString()} icon={<AgentIcon />} />
        <Card title="Pending Discrepancies" value={pendingDiscrepancies.toLocaleString()} icon={<AlertIcon />} trend="-5%" trendDirection="down" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue Over Time (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#1d4ed8" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Agents by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Discrepancies by Status</h3>
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={discrepancyStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey={DiscrepancyStatus.Resolved} name="Resolved" stackId="a" fill="#3b82f6" />
              <Bar dataKey={DiscrepancyStatus.Pending} name="Pending Investigation" stackId="a" fill="#f59e0b" />
              <Bar dataKey={DiscrepancyStatus.ActionRequired} name="Action Required" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
