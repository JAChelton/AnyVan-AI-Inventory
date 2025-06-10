import React, { useState } from 'react';
import { Search, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { aiInventoryService, AIGeneratedItem } from '../services/aiInventoryService';

interface AIItemSearchProps {
  onItemGenerated: (item: AIGeneratedItem) => void;
}

export const AIItemSearch: React.FC<AIItemSearchProps> = ({ onItemGenerated }) => {
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchText.trim() || isLoading) return;
    
    setIsLoading(true);
    setStatus({
      type: 'loading',
      message: `🔍 Searching multiple sources for "${searchText}"...`
    });
    
    try {
      const aiItem = await aiInventoryService.generateAIItem(searchText.trim());
      
      if (aiItem) {
        setStatus({
          type: 'success',
          message: `✅ Found "${aiItem.name}" - ${aiItem.weight}kg (${aiItem.source}, ${Math.round(aiItem.confidence * 100)}% confidence)`
        });
        
        onItemGenerated(aiItem);
        setSearchText('');
        
        setTimeout(() => {
          setStatus({ type: 'idle', message: '' });
        }, 5000);
      } else {
        setStatus({
          type: 'error',
          message: `❌ Couldn't find reliable data for "${searchText}"`
        });
        
        setTimeout(() => {
          setStatus({ type: 'idle', message: '' });
        }, 3000);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `❌ Search failed for "${searchText}"`
      });
      
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' });
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status.type) {
      case 'loading':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        AI-Enhanced Item Search
      </h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Describe an item (e.g., 'large wooden dining table', 'exercise bike')"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={!searchText.trim() || isLoading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search & Generate Item
            </>
          )}
        </button>
      </form>
      
      {status.type !== 'idle' && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
          status.type === 'success' ? 'bg-green-50 text-green-800' :
          status.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {getStatusIcon()}
          <span className="text-sm">{status.message}</span>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>How it works:</strong> Describe any item and our AI will search multiple sources 
          (Wikipedia, product databases, manufacturer sites) to find accurate weight, dimensions, 
          and specifications.
        </p>
      </div>
    </div>
  );
};