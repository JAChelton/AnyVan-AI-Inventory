import React from 'react';
import { Plus, Brain, Ruler, Copyright as Weight, Trash2 } from 'lucide-react';
import { AIGeneratedItem } from '../services/aiInventoryService';

interface AIItemCardProps {
  item: AIGeneratedItem;
  onAddToInventory: (item: AIGeneratedItem) => void;
  onRemove: (id: number) => void;
}

export const AIItemCard: React.FC<AIItemCardProps> = ({ item, onAddToInventory, onRemove }) => {
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}L`;
    }
    return `${volume.toLocaleString()} cm³`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onAddToInventory(item)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Add to inventory"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Remove AI item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Weight className="w-4 h-4" />
          <span>{item.weight} kg</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          <span>{item.height}×{item.width}×{item.depth} cm</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 text-center">📦</span>
          <span>{formatVolume(item.volume)}</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Source: {item.source}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(item.confidence)}`}>
            {Math.round(item.confidence * 100)}% confidence
          </span>
        </div>
        
        {item.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {item.description}
          </p>
        )}
        
        <div className="text-xs text-gray-400">
          Original: "{item.originalText}"
        </div>
      </div>
    </div>
  );
};