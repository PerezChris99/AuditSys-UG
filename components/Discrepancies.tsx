
import React from 'react';
import { useData } from '../context/DataContext';
import { Discrepancy } from '../types';
import StatusBadge from './ui/StatusBadge';

const Discrepancies: React.FC = () => {
  const { discrepancies: mockDiscrepancies } = useData();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Flagged Discrepancies</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discrepancy ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockDiscrepancies.map((discrepancy: Discrepancy) => (
              <tr key={discrepancy.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{discrepancy.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{discrepancy.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{discrepancy.details}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-semibold">${discrepancy.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(discrepancy.reportedAt).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  <StatusBadge status={discrepancy.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Discrepancies;
