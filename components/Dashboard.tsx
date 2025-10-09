import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    LineChart, Line, ScatterChart, Scatter, ZAxis, Treemap 
} from 'recharts';
import { useData } from '../context/DataContext';
import { DiscrepancyStatus } from '../types';
import Card from './ui/Card';
import { DollarSignIcon, TicketIcon, AgentIcon, AlertIcon, ShieldExclamationIcon } from './ui/Icons';
import { useAuth } from '../context/AuthContext';
import AIInsights from './ui/AIInsights';

const Dashboard: React.FC = () => {
  const { agents, tickets, discrepancies, transactions } = useData();
  const { user } = useAuth();

  const isAgentRole = user?.role === 'Agent';
  
  // Data is pre-filtered from the DataContext if user is an agent
  const totalRevenue = tickets.reduce((acc, ticket) => acc + ticket.price, 0);
  const totalTickets = tickets.length;
  const totalAgents = agents.length;
  const pendingDiscrepancies = discrepancies.filter(d => d.status.includes('Pending')).length;

  const avgFraudScore = transactions.length > 0
    ? transactions.reduce((acc, tx) => acc + (tx.fraudScore || 0), 0) / transactions.length
    : 0;
  
  const salesData = tickets
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

  const agentPerformanceData = [...agents]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
    .map(agent => ({
      name: agent.name.split(' ')[0],
      revenue: agent.totalRevenue,
  }));
  
  const discrepancyStatusData = discrepancies
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
    
    const fraudScoreData = transactions
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .reduce((acc, tx) => {
            if (!tx.fraudScore) return acc;
            const date = new Date(tx.timestamp).toISOString().substring(5, 10); // MM-DD
            if (!acc[date]) {
                acc[date] = { sum: 0, count: 0 };
            }
            acc[date].sum += tx.fraudScore;
            acc[date].count++;
            return acc;
        }, {} as Record<string, { sum: number, count: number }>)

    const fraudScoreChartData = Object.entries(fraudScoreData).map(([date, {sum, count}]) => ({
        name: date,
        score: parseFloat((sum / count).toFixed(1)),
    })).slice(-30);

    // Data for new charts
    const agentCorrelationData = agents.map(agent => ({
        x: agent.accuracy,
        y: agent.disputeRate,
        z: agent.totalRevenue,
        name: agent.name,
    }));

    const destinationRevenueData = tickets.reduce((acc, ticket) => {
        if (ticket.status === 'Completed') {
            const destination = ticket.destination;
            acc[destination] = (acc[destination] || 0) + ticket.price;
        }
        return acc;
    }, {} as Record<string, number>);

    const treemapData = Object.entries(destinationRevenueData)
      .map(([name, size]) => ({ name, size }))
      .sort((a, b) => b.size - a.size);


    // Custom components for new charts
    const CustomScatterTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
                    <p className="font-bold text-gray-800">{data.name}</p>
                    <p>Accuracy: <span className="font-medium">{data.x.toFixed(1)}%</span></p>
                    <p>Dispute Rate: <span className="font-medium">{data.y.toFixed(1)}%</span></p>
                    <p>Revenue: <span className="font-medium">${data.z.toLocaleString()}</span></p>
                </div>
            );
        }
        return null;
    };

    const TREEMAP_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    
    // FIX: Converted the class component to a functional component to resolve an issue where 'this.props' was not being recognized.
    const CustomizedTreemapContent = (props: any) => {
        const { x, y, width, height, index, name, size } = props;

        // Don't render text if the box is too small
        if (width < 35 || height < 35) {
            return null;
        }
    
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: TREEMAP_COLORS[index % TREEMAP_COLORS.length],
                        stroke: '#fff',
                        strokeWidth: 2,
                    }}
                />
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {name}
                </text>
                 <text
                    x={x + width / 2}
                    y={y + height / 2 + 18}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    opacity={0.8}
                    style={{ pointerEvents: 'none' }}
                >
                    ${(size / 1000).toFixed(0)}k
                </text>
            </g>
        );
    };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title={isAgentRole ? "My Revenue" : "Total Revenue"} value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSignIcon />} />
        <Card title={isAgentRole ? "My Tickets Sold" : "Tickets Sold"} value={totalTickets.toLocaleString()} icon={<TicketIcon />} />
        {!isAgentRole && (
          <>
            <Card title="Avg. Fraud Score" value={avgFraudScore.toFixed(1)} icon={<ShieldExclamationIcon />} />
            <Card title="Pending Discrepancies" value={pendingDiscrepancies.toLocaleString()} icon={<AlertIcon />} trend="-5%" trendDirection="down" />
          </>
        )}
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
        
        {!isAgentRole && (
            <>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Fraud Risk Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={fraudScoreChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} name="Avg. Score" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Agents by Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#2563eb" name="Revenue" />
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
            
            {/* New Charts Start Here */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Agent Accuracy vs. Dispute Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="x" name="Accuracy" unit="%" domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={(tick) => `${tick}%`}/>
                        <YAxis type="number" dataKey="y" name="Dispute Rate" unit="%" tickFormatter={(tick) => `${tick}%`}/>
                        <ZAxis type="number" dataKey="z" range={[60, 400]} name="Revenue" unit="$" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                        <Legend />
                        <Scatter name="Agent Performance" data={agentCorrelationData} fill="#1d4ed8" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue by Destination</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                        data={treemapData}
                        dataKey="size"
                        ratio={4 / 3}
                        stroke="#fff"
                        content={<CustomizedTreemapContent />}
                    >
                        <Tooltip formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}/>
                    </Treemap>
                </ResponsiveContainer>
            </div>
            {/* New Charts End Here */}
          </>
        )}
      </div>
      
      {!isAgentRole && (
        <AIInsights />
      )}
    </div>
  );
};

export default Dashboard;