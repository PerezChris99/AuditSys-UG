
import React from 'react';
import { useData } from '../context/DataContext';
import { Agent } from '../types';
import { useNavigate } from 'react-router-dom';

const AgentPerformance: React.FC = () => {
  const { agents: mockAgents } = useData();
  const navigate = useNavigate();

  const handleViewTransactions = (agentId: string) => {
    navigate(`/ledger?agentId=${agentId}`);
  };

  return (
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
  );
};

export default AgentPerformance;