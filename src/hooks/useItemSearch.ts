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
      threshold: 0.4, // More strict threshold for better matches
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
      
      // Enhanced search with multiple strategies
      const searchResults = new Set<InventoryItem>();
      
      // Strategy 1: Direct substring matching (highest priority)
      inventoryItems.forEach(item => {
        const itemName = item.name.toLowerCase();
        if (itemName.includes(normalizedSearch)) {
          searchResults.add(item);
        }
      });
      
      // Strategy 2: Handle bed size variations specifically
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
        'double': ['double bed'],
        'twin': ['twin bed'],
        'full': ['full bed', 'full size']
      };
      
      // Check bed size variations
      for (const [searchVariant, itemVariants] of Object.entries(bedSizeVariations)) {
        if (normalizedSearch.includes(searchVariant)) {
          inventoryItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            for (const variant of itemVariants) {
              if (itemName.includes(variant)) {
                searchResults.add(item);
              }
            }
          });
        }
      }
      
      // Strategy 3: Word-by-word matching
      const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 1);
      if (searchWords.length > 1) {
        inventoryItems.forEach(item => {
          const itemName = item.name.toLowerCase();
          const matchedWords = searchWords.filter(word => {
            // Handle size variations
            if (word === 'king' && (itemName.includes('kingsize') || itemName.includes('king'))) {
              return true;
            }
            if (word === 'size' && (itemName.includes('kingsize') || itemName.includes('queensize'))) {
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
          
          // If most words match, include the item
          if (matchedWords.length >= Math.ceil(searchWords.length * 0.7)) {
            searchResults.add(item);
          }
        });
      }
      
      // Strategy 4: Fuzzy search for remaining cases
      if (searchResults.size === 0) {
        const fuseResults = fuse.search(searchTerm);
        fuseResults.forEach(result => {
          if (result.score && result.score < 0.6) { // Only good matches
            searchResults.add(result.item);
          }
        });
      }
      
      // Strategy 5: Partial word matching for single words
      if (searchResults.size === 0 && searchWords.length === 1) {
        const searchWord = searchWords[0];
        if (searchWord.length >= 3) {
          inventoryItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            if (itemName.includes(searchWord)) {
              searchResults.add(item);
            }
          });
        }
      }
      
      // Convert Set back to Array and sort by relevance
      const combinedResults = Array.from(searchResults);
      
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
        
        // Starts with search term gets third priority
        const aStarts = aName.startsWith(normalizedSearch);
        const bStarts = bName.startsWith(normalizedSearch);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
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

  // Helper function to check if search has good results
  const hasGoodResults = (searchTerm: string): boolean => {
    if (!searchTerm.trim()) return false;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Check for direct matches
    const directMatches = inventoryItems.filter(item => 
      item.name.toLowerCase().includes(normalizedSearch)
    );
    
    if (directMatches.length > 0) return true;
    
    // Check for bed size variations
    const bedSizeVariations = {
      'king size': ['kingsize', 'king'],
      'kingsize': ['king size', 'king'],
      'king': ['kingsize', 'king size'],
      'queen size': ['queensize', 'queen'],
      'queensize': ['queen size', 'queen'],
      'queen': ['queensize', 'queen size']
    };
    
    for (const [searchVariant, itemVariants] of Object.entries(bedSizeVariations)) {
      if (normalizedSearch.includes(searchVariant)) {
        const variantMatches = inventoryItems.filter(item => {
          const itemName = item.name.toLowerCase();
          return itemVariants.some(variant => itemName.includes(variant));
        });
        if (variantMatches.length > 0) return true;
      }
    }
    
    return false;
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    filteredItems,
    hasGoodResults: hasGoodResults(searchTerm)
  };
};