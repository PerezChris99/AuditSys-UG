
import React from 'react';
import { TransactionStatus, DiscrepancyStatus } from '../../types';

interface StatusBadgeProps {
  status: TransactionStatus | DiscrepancyStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: { [key: string]: string } = {
    // Transaction Statuses
    [TransactionStatus.Completed]: 'bg-green-100 text-green-800',
    [TransactionStatus.Pending]: 'bg-yellow-100 text-yellow-800',
    [TransactionStatus.Void]: 'bg-gray-100 text-gray-800',
    // Discrepancy Statuses
    [DiscrepancyStatus.Resolved]: 'bg-blue-100 text-blue-800',
    [DiscrepancyStatus.Pending]: 'bg-yellow-100 text-yellow-800',
    [DiscrepancyStatus.ActionRequired]: 'bg-red-100 text-red-800',
  };

  const style = statusStyles[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
