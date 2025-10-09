
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Agent } from '../types';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { getAgentPerformanceReview } from '../lib/gemini';
import { marked } from 'marked';
import { SparklesIcon } from './ui/Icons';


const AgentPerformance: React.FC = () => {
  const { agents: mockAgents } = useData();
  const navigate = useNavigate();

  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [isReviewLoading, setReviewLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleViewTransactions = (agentId: string) => {
    navigate(`/ledger?agentId=${agentId}`);
  };

  const handleGenerateReview = async (agent: Agent) => {
    setSelectedAgent(agent);
    setReviewModalOpen(true);
    setReviewLoading(true);
    setReviewContent('');
    try {
        const review = await getAgentPerformanceReview(agent);
        const html = await marked.parse(review);
        setReviewContent(html);
    } catch (error) {
        setReviewContent('<p class="text-red-500">Could not generate AI review.</p>');
    } finally {
        setReviewLoading(false);
    }
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedAgent(null);
    setReviewContent('');
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

  const ReviewModal = () => {
    if (!isReviewModalOpen || !selectedAgent) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">AI Performance Review: <span className="text-primary-700">{selectedAgent.name}</span></h2>
                {isReviewLoading ? (
                     <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mt-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: reviewContent }} />
                )}
                <div className="mt-6 flex justify-end">
                    <button onClick={closeReviewModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="space-y-6">
      <ReviewModal />
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
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">AI Review</th>
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
                   <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleGenerateReview(agent)}
                      className="text-primary-600 hover:text-primary-900 font-semibold flex items-center justify-center mx-auto"
                    >
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      Generate
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
                        // FIX: Corrected the type of the label function parameter to `any` to resolve type incompatibility with recharts. The library's type definitions seem to be missing the 'percent' property.
                        label={({ name, percent }: any) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
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
