// src/components/StatsCard.tsx - REPLACE your existing file with this fixed version

import React from 'react';
import { LucideIcon } from 'lucide-react'; // Fixed import

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend,
  onClick 
}) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};