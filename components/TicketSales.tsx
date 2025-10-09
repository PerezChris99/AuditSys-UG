import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Ticket, TransactionStatus } from '../types';
import StatusBadge from './ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import MultiSelectDropdown from './ui/MultiSelectDropdown';

const TicketSales: React.FC = () => {
  const { tickets, agents } = useData();
  const { user } = useAuth();
  const isAgentRole = user?.role === 'Agent';

  const [filters, setFilters] = useState({
    searchTerm: '',
    startDate: '',
    endDate: '',
    statuses: [] as string[],
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    origin: '',
    destination: '',
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };
  
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      startDate: '',
      endDate: '',
      statuses: [],
      minPrice: undefined,
      maxPrice: undefined,
      origin: '',
      destination: '',
    });
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const searchMatch = !filters.searchTerm ||
        ticket.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        ticket.passengerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        ticket.flightNumber.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const ticketDate = new Date(ticket.travelDate);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);

      const dateMatch = (!startDate || ticketDate >= startDate) && (!endDate || ticketDate <= endDate);
      const statusMatch = filters.statuses?.length === 0 || filters.statuses?.includes(ticket.status);
      
      const priceMatch = (!filters.minPrice || ticket.price >= filters.minPrice) && (!filters.maxPrice || ticket.price <= filters.maxPrice);
      const originMatch = !filters.origin || ticket.origin.toLowerCase() === filters.origin.toLowerCase();
      const destinationMatch = !filters.destination || ticket.destination.toLowerCase() === filters.destination.toLowerCase();

      return searchMatch && dateMatch && statusMatch && priceMatch && originMatch && destinationMatch;
    });
  }, [filters, tickets]);

  const getAgentName = (agentId: string) => agents.find(a => a.id === agentId)?.name || 'Unknown Agent';

  const statusOptions = Object.values(TransactionStatus);

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
       <h2 className="text-xl font-semibold text-gray-700">{isAgentRole ? "My Ticket Sales" : "All Ticket Sales"}</h2>
      
       <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-2">
              <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">Search by ID, Passenger, or Flight</label>
              <input
                id="search-term"
                type="text"
                placeholder="Search..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
             <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Travel Date From</label>
              <input type="date" id="start-date" value={filters.startDate || ''} onChange={e => handleFilterChange('startDate', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Travel Date To</label>
              <input type="date" id="end-date" value={filters.endDate || ''} onChange={e => handleFilterChange('endDate', e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
             <div className="lg:col-span-2">
                <MultiSelectDropdown 
                    label="Status"
                    options={statusOptions}
                    selectedOptions={filters.statuses || []}
                    onChange={(selected) => handleFilterChange('statuses', selected)}
                />
            </div>
            <div className="flex items-end h-full">
                <button onClick={clearFilters} className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Clear Filters</button>
            </div>
          </div>
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
              <tr><td colSpan={isAgentRole ? 7 : 8} className="text-center py-10 text-gray-500">No ticket sales found matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketSales;