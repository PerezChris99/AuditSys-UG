import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Ticket } from '../types';
import StatusBadge from './ui/StatusBadge';
import { useAuth } from '../context/AuthContext';

const TicketSales: React.FC = () => {
  const { tickets, agents } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const isAgentRole = user?.role === 'Agent';

  const filteredTickets = useMemo(() => {
    // Data is already pre-filtered by the API if the user is an agent
    if (!searchTerm) {
      return tickets;
    }

    return tickets.filter(ticket =>
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.flightNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, tickets]);

  const getAgentName = (agentId: string) => agents.find(a => a.id === agentId)?.name || 'Unknown Agent';

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">{isAgentRole ? "My Ticket Sales" : "All Ticket Sales"}</h2>
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              {!isAgentRole && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>}
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTickets.map((ticket: Ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.passengerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.flightNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.origin} &rarr; {ticket.destination}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.travelDate}</td>
                {!isAgentRole && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getAgentName(ticket.agentId)}</td>}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${ticket.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  <StatusBadge status={ticket.status} />
                </td>
              </tr>
            ))}
             {filteredTickets.length === 0 && (
              <tr><td colSpan={isAgentRole ? 7 : 8} className="text-center py-10 text-gray-500">No ticket sales found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketSales;
