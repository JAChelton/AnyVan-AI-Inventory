import { useState, useEffect } from 'react';
import { InventoryRecord, InventoryItem } from '../types/inventory';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);

  useEffect(() => {
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    }
  }, []);

  const saveInventory = (newInventory: InventoryRecord[]) => {
    setInventory(newInventory);
    localStorage.setItem('inventory', JSON.stringify(newInventory));
  };

  const addItem = (item: InventoryItem, quantity: number, location: string, notes?: string) => {
    const newRecord: InventoryRecord = {
      id: Date.now().toString(),
      item,
      quantity,
      location,
      dateAdded: new Date().toISOString(),
      notes
    };
    saveInventory([...inventory, newRecord]);
  };

  const updateItem = (id: string, updates: Partial<InventoryRecord>) => {
    const updatedInventory = inventory.map(record =>
      record.id === id ? { ...record, ...updates } : record
    );
    saveInventory(updatedInventory);
  };

  const removeItem = (id: string) => {
    const updatedInventory = inventory.filter(record => record.id !== id);
    saveInventory(updatedInventory);
  };

  const getTotalItems = () => inventory.reduce((total, record) => total + record.quantity, 0);
  
  const getTotalVolume = () => inventory.reduce((total, record) => 
    total + (record.item.volume * record.quantity), 0
  );

  const getTotalWeight = () => inventory.reduce((total, record) => 
    total + (record.item.weight * record.quantity), 0
  );

  return {
    inventory,
    addItem,
    updateItem,
    removeItem,
    getTotalItems,
    getTotalVolume,
    getTotalWeight
  };
};