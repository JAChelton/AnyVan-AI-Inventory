import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { InventoryItem, SearchFilters } from '../types/inventory';
import { inventoryItems } from '../data/inventoryItems';

export const useItemSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  const fuse = useMemo(() => {
    return new Fuse(inventoryItems, {
      keys: [
        { name: 'name', weight: 1.0 }
      ],
      threshold: 0.5, // More lenient threshold
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2
    });
  }, []);

  const filteredItems = useMemo(() => {
    let items = inventoryItems;

    // Apply text search
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      
      // First try exact fuzzy search
      const fuseResults = fuse.search(searchTerm);
      let searchResults = fuseResults.map(result => result.item);
      
      // Enhanced search strategies for better matching
      const enhancedMatches = inventoryItems.filter(item => {
        const itemName = item.name.toLowerCase();
        
        // Direct substring match
        if (itemName.includes(normalizedSearch)) {
          return true;
        }
        
        // Handle bed size variations specifically
        const bedSizeVariations = {
          'king size': ['kingsize', 'king'],
          'kingsize': ['king size', 'king'],
          'king': ['kingsize', 'king size'],
          'queen size': ['queensize', 'queen'],
          'queensize': ['queen size', 'queen'],
          'queen': ['queensize', 'queen size'],
          'super king': ['superking', 'super kingsize'],
          'superking': ['super king', 'super kingsize'],
          'single': ['single bed'],
          'double': ['double bed']
        };
        
        // Check bed size variations
        for (const [searchVariant, itemVariants] of Object.entries(bedSizeVariations)) {
          if (normalizedSearch.includes(searchVariant)) {
            for (const variant of itemVariants) {
              if (itemName.includes(variant)) {
                return true;
              }
            }
          }
        }
        
        // Split search into words and check if all words match
        const searchWords = normalizedSearch.split(/\s+/);
        const allWordsMatch = searchWords.every(word => {
          // Handle size variations
          if (word === 'king' && (itemName.includes('kingsize') || itemName.includes('king'))) {
            return true;
          }
          if (word === 'size' && (itemName.includes('kingsize') || itemName.includes('queensize') || itemName.includes('superking'))) {
            return true;
          }
          if (word === 'queen' && (itemName.includes('queensize') || itemName.includes('queen'))) {
            return true;
          }
          if (word === 'super' && itemName.includes('superking')) {
            return true;
          }
          
          return itemName.includes(word);
        });
        
        // Partial word matching - check if search term appears in any part of the item name
        const partialMatch = searchWords.some(word => {
          if (word.length >= 3) { // Only for words 3+ characters
            return itemName.includes(word);
          }
          return false;
        });
        
        return allWordsMatch || partialMatch;
      });
      
      // Combine and deduplicate results, prioritizing exact matches
      const combinedResults = [...searchResults];
      enhancedMatches.forEach(item => {
        if (!combinedResults.find(existing => existing.id === item.id)) {
          combinedResults.push(item);
        }
      });
      
      // Sort results by relevance (exact matches first, then partial matches)
      combinedResults.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match gets highest priority
        const aExact = aName === normalizedSearch;
        const bExact = bName === normalizedSearch;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Contains full search term gets second priority
        const aContains = aName.includes(normalizedSearch);
        const bContains = bName.includes(normalizedSearch);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        
        // Shorter names get priority (more specific)
        return a.name.length - b.name.length;
      });
      
      items = combinedResults;
    }

    // Apply filters
    if (filters.minWeight !== undefined) {
      items = items.filter(item => item.weight >= filters.minWeight!);
    }
    if (filters.maxWeight !== undefined) {
      items = items.filter(item => item.weight <= filters.maxWeight!);
    }
    if (filters.minVolume !== undefined) {
      items = items.filter(item => item.volume >= filters.minVolume!);
    }
    if (filters.maxVolume !== undefined) {
      items = items.filter(item => item.volume <= filters.maxVolume!);
    }

    return items.slice(0, 50); // Limit results for performance
  }, [searchTerm, filters, fuse]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    filteredItems
  };
};