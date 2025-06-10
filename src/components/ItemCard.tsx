import React from 'react';
import { Plus, Package, Ruler, Weight } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface ItemCardProps {
  item: InventoryItem;
  onAddToInventory: (item: InventoryItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onAddToInventory }) => {
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}L`;
    }
    return `${volume.toLocaleString()} cm³`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        <button
          onClick={() => onAddToInventory(item)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="Add to inventory"
        >
          <Plus className="w-5 h-5" />
        </button>
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
          <Package className="w-4 h-4" />
          <span>{formatVolume(item.volume)}</span>
        </div>
        
        <div className="text-xs text-gray-500">
          Rank: {item.rank} | ID: {item.id}
        </div>
      </div>
    </div>
  );
};