import { useState, useCallback } from 'react';
import { AIGeneratedItem } from '../services/aiInventoryService';
import { InventoryItem } from '../types/inventory';

export const useAIInventory = () => {
  const [aiItems, setAiItems] = useState<AIGeneratedItem[]>([]);

  const addAIItem = useCallback((aiItem: AIGeneratedItem) => {
    setAiItems(prev => {
      // Check if item already exists
      const exists = prev.some(item => 
        item.name.toLowerCase() === aiItem.name.toLowerCase() ||
        item.originalText.toLowerCase() === aiItem.originalText.toLowerCase()
      );
      
      if (exists) {
        return prev;
      }
      
      return [...prev, aiItem];
    });
  }, []);

  const removeAIItem = useCallback((id: number) => {
    setAiItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const convertToInventoryItem = useCallback((aiItem: AIGeneratedItem): InventoryItem => {
    return {
      id: aiItem.id,
      name: aiItem.name,
      weight: aiItem.weight,
      height: aiItem.height,
      depth: aiItem.depth,
      width: aiItem.width,
      volume: aiItem.volume,
      rank: aiItem.rank
    };
  }, []);

  const getAllItems = useCallback((): InventoryItem[] => {
    return aiItems.map(convertToInventoryItem);
  }, [aiItems, convertToInventoryItem]);

  return {
    aiItems,
    addAIItem,
    removeAIItem,
    convertToInventoryItem,
    getAllItems
  };
};