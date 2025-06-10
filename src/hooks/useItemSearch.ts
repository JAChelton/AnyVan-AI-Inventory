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
      threshold: 0.4, // More lenient threshold for better matching
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
      // First try exact fuzzy search
      const results = fuse.search(searchTerm);
      let searchResults = results.map(result => result.item);
      
      // If no results or very few results, try alternative search strategies
      if (searchResults.length < 3) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        // Try partial word matching for compound terms
        const partialMatches = inventoryItems.filter(item => {
          const itemName = item.name.toLowerCase();
          
          // Split search term into words
          const searchWords = normalizedSearch.split(/\s+/);
          
          // Check if all search words are found in the item name
          const allWordsMatch = searchWords.every(word => {
            // Handle common variations
            let searchWord = word;
            if (word === 'king' && normalizedSearch.includes('size')) {
              searchWord = 'kingsize';
            }
            if (word === 'queen' && normalizedSearch.includes('size')) {
              searchWord = 'queensize';
            }
            if (word === 'super' && normalizedSearch.includes('king')) {
              searchWord = 'superking';
            }
            
            return itemName.includes(searchWord) || 
                   itemName.includes(word) ||
                   // Handle size variations
                   (word === 'size' && (itemName.includes('kingsize') || itemName.includes('queensize') || itemName.includes('superking')));
          });
          
          // Also check for direct substring match
          const directMatch = itemName.includes(normalizedSearch);
          
          // Check for common bed size patterns
          const bedSizeMatch = (
            (normalizedSearch.includes('king') && itemName.includes('kingsize')) ||
            (normalizedSearch.includes('queen') && itemName.includes('queensize')) ||
            (normalizedSearch.includes('super king') && itemName.includes('superking')) ||
            (normalizedSearch.includes('single') && itemName.includes('single')) ||
            (normalizedSearch.includes('double') && itemName.includes('double'))
          );
          
          return allWordsMatch || directMatch || bedSizeMatch;
        });
        
        // Combine and deduplicate results
        const combinedResults = [...searchResults];
        partialMatches.forEach(item => {
          if (!combinedResults.find(existing => existing.id === item.id)) {
            combinedResults.push(item);
          }
        });
        
        searchResults = combinedResults;
      }
      
      items = searchResults;
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