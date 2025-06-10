import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { InventoryRecord } from '../types/inventory';

interface EditItemModalProps {
  record: InventoryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<InventoryRecord>) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  record,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (record) {
      setQuantity(record.quantity);
      setLocation(record.location);
      setNotes(record.notes || '');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onUpdate(record.id, {
        quantity,
        location: location.trim(),
        notes: notes.trim() || undefined
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Inventory Item</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">{record.item.name}</h4>
          <p className="text-sm text-gray-600">
            {record.item.weight}kg • {record.item.height}×{record.item.width}×{record.item.depth}cm
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Warehouse A, Shelf 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};