import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterClick: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onFilterClick,
  onClear,
  hasActiveFilters
}) => {
  return (
    <div className="relative flex items-center gap-2 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search items by name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <button
        onClick={onFilterClick}
        className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
          hasActiveFilters 
            ? 'bg-blue-50 border-blue-300 text-blue-700' 
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-5 h-5" />
        Filters
      </button>

      {(searchTerm || hasActiveFilters) && (
        <button
          onClick={onClear}
          className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};