import React from 'react';
import { useData } from '../context/DataContext';
import { Agent } from '../types';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const AgentPerformance: React.FC = () => {
  const { agents: mockAgents } = useData();
  const navigate = useNavigate();

  const handleViewTransactions = (agentId: string) => {
    navigate(`/ledger?agentId=${agentId}`);
  };

  // Mock data for "Tickets Sold Over Time"
  const ticketsOverTimeData = [
    { name: 'Jan', tickets: 420 },
    { name: 'Feb', tickets: 350 },
    { name: 'Mar', tickets: 510 },
    { name: 'Apr', tickets: 480 },
    { name: 'May', tickets: 620 },
    { name: 'Jun', tickets: 580 },
  ];
  
  // Data for "Discrepancy Rate Distribution"
  const discrepancyRateData = mockAgents.map(agent => ({
    name: agent.name,
    value: agent.disputeRate,
  }));
  
  const COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Agent Performance Metrics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dispute Rate</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockAgents.map((agent: Agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={agent.avatarUrl} alt={agent.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{agent.ticketsSold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${agent.totalRevenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={agent.accuracy > 98 ? "text-green-600" : "text-yellow-600"}>{agent.accuracy}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={agent.disputeRate < 1 ? "text-green-600" : "text-red-600"}>{agent.disputeRate}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleViewTransactions(agent.id)}
                      className="text-primary-600 hover:text-primary-900 font-semibold"
                    >
                      View Transactions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Tickets Sold Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ticketsOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tickets" stroke="#1d4ed8" strokeWidth={2} name="Tickets Sold" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Discrepancy Rate Distribution</h3>
             <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={discrepancyRateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {discrepancyRateData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default AgentPerformance;