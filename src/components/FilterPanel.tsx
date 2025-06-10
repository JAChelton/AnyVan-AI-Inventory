import React from 'react';
import { X } from 'lucide-react';
import { SearchFilters } from '../types/inventory';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filter Items</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Range (kg)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minWeight || ''}
                onChange={(e) => onFiltersChange({ 
                  minWeight: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxWeight || ''}
                onChange={(e) => onFiltersChange({ 
                  maxWeight: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume Range (cm³)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minVolume || ''}
                onChange={(e) => onFiltersChange({ 
                  minVolume: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxVolume || ''}
                onChange={(e) => onFiltersChange({ 
                  maxVolume: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => {
                onFiltersChange({
                  minWeight: undefined,
                  maxWeight: undefined,
                  minVolume: undefined,
                  maxVolume: undefined
                });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};