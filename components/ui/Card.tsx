
import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
}

const Card: React.FC<CardProps> = ({ title, value, icon, trend, trendDirection }) => {
  const trendColor = trendDirection === 'up' ? 'text-green-500' : 'text-red-500';
  const trendIcon = trendDirection === 'up' ? '↑' : '↓';

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-primary-100 text-primary-600">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-baseline">
          <span className={`text-sm font-semibold ${trendColor}`}>
            {trendIcon} {trend}
          </span>
          <span className="ml-2 text-xs text-gray-500">vs. last month</span>
        </div>
      )}
    </div>
  );
};

export default Card;
