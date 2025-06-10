import React from 'react';
import { Edit2, Trash2, MapPin, Calendar, Package } from 'lucide-react';
import { InventoryRecord } from '../types/inventory';

interface InventoryListProps {
  inventory: InventoryRecord[];
  onEdit: (record: InventoryRecord) => void;
  onDelete: (id: string) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  inventory,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}L`;
    }
    return `${volume.toLocaleString()} cm³`;
  };

  if (inventory.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items in inventory</h3>
        <p className="text-gray-500">Start by searching and adding items to your inventory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inventory.map((record) => (
        <div key={record.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">{record.item.name}</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <span className="font-medium">Quantity:</span> {record.quantity}
                </div>
                <div>
                  <span className="font-medium">Weight:</span> {record.item.weight * record.quantity} kg
                </div>
                <div>
                  <span className="font-medium">Volume:</span> {formatVolume(record.item.volume * record.quantity)}
                </div>
                <div>
                  <span className="font-medium">Dimensions:</span> {record.item.height}×{record.item.width}×{record.item.depth} cm
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {record.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Added {formatDate(record.dateAdded)}
                </div>
              </div>

              {record.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {record.notes}
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(record)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Edit item"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(record.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};