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
      threshold: 0.6, // More lenient threshold
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 1
    });
  }, []);

  const filteredItems = useMemo(() => {
    let items = inventoryItems;

    // Apply text search
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      console.log('Searching for:', normalizedSearch);
      
      // Enhanced search with multiple strategies
      const searchResults = new Set<InventoryItem>();
      
      // Strategy 1: Direct substring matching (case insensitive)
      inventoryItems.forEach(item => {
        const itemName = item.name.toLowerCase();
        console.log('Checking item:', itemName, 'against search:', normalizedSearch);
        
        if (itemName.includes(normalizedSearch)) {
          console.log('✅ Direct match found:', item.name);
          searchResults.add(item);
        }
      });
      
      // Strategy 2: Handle common variations and synonyms
      const searchVariations = {
        // Bed size variations
        'kingsize': ['kingsize', 'king size', 'king'],
        'king size': ['kingsize', 'king size', 'king'],
        'king': ['kingsize', 'king size', 'king'],
        'kingsize bed': ['kingsize', 'king size', 'king'],
        'king size bed': ['kingsize', 'king size', 'king'],
        'king bed': ['kingsize', 'king size', 'king'],
        
        // Other bed sizes
        'queensize': ['queensize', 'queen size', 'queen'],
        'queen size': ['queensize', 'queen size', 'queen'],
        'queen': ['queensize', 'queen size', 'queen'],
        'single': ['single'],
        'double': ['double'],
        
        // Furniture variations
        'sofa': ['sofa', 'couch'],
        'couch': ['sofa', 'couch'],
        'table': ['table'],
        'chair': ['chair'],
        'wardrobe': ['wardrobe', 'closet'],
        'closet': ['wardrobe', 'closet'],
        
        // Box variations
        'box': ['box'],
        'large box': ['large box'],
        'medium box': ['medium box'],
        'small box': ['small box'],
        
        // Appliance variations
        'tv': ['television', 'tv'],
        'television': ['television', 'tv'],
        'fridge': ['fridge', 'refrigerator'],
        'refrigerator': ['fridge', 'refrigerator']
      };
      
      // Check variations
      const searchVariants = searchVariations[normalizedSearch] || [normalizedSearch];
      console.log('Search variants:', searchVariants);
      
      searchVariants.forEach(variant => {
        inventoryItems.forEach(item => {
          const itemName = item.name.toLowerCase();
          if (itemName.includes(variant)) {
            console.log('✅ Variant match found:', item.name, 'for variant:', variant);
            searchResults.add(item);
          }
        });
      });
      
      // Strategy 3: Word-by-word matching for multi-word searches
      const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 1);
      console.log('Search words:', searchWords);
      
      if (searchWords.length > 0) {
        inventoryItems.forEach(item => {
          const itemName = item.name.toLowerCase();
          const itemWords = itemName.split(/\s+/);
          
          let matchCount = 0;
          searchWords.forEach(searchWord => {
            // Check for exact word matches or partial matches
            const hasMatch = itemWords.some(itemWord => {
              return itemWord.includes(searchWord) || searchWord.includes(itemWord);
            });
            
            if (hasMatch) {
              matchCount++;
            }
          });
          
          // If at least 70% of search words match, include the item
          const matchRatio = matchCount / searchWords.length;
          if (matchRatio >= 0.7) {
            console.log('✅ Word match found:', item.name, 'match ratio:', matchRatio);
            searchResults.add(item);
          }
        });
      }
      
      // Strategy 4: Fuzzy search as fallback
      if (searchResults.size === 0) {
        console.log('No direct matches, trying fuzzy search...');
        const fuseResults = fuse.search(searchTerm);
        console.log('Fuzzy search results:', fuseResults);
        
        fuseResults.forEach(result => {
          if (result.score && result.score < 0.8) { // More lenient fuzzy matching
            console.log('✅ Fuzzy match found:', result.item.name, 'score:', result.score);
            searchResults.add(result.item);
          }
        });
      }
      
      // Strategy 5: Partial matching for single words
      if (searchResults.size === 0 && searchWords.length === 1) {
        const searchWord = searchWords[0];
        if (searchWord.length >= 2) {
          inventoryItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            // Check if any word in the item name contains the search word
            const itemWords = itemName.split(/\s+/);
            const hasPartialMatch = itemWords.some(word => 
              word.includes(searchWord) || searchWord.includes(word)
            );
            
            if (hasPartialMatch) {
              console.log('✅ Partial match found:', item.name);
              searchResults.add(item);
            }
          });
        }
      }
      
      console.log('Total matches found:', searchResults.size);
      
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
  const hasGoodResults = useMemo(() => {
    return filteredItems.length > 0;
  }, [filteredItems]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    filteredItems,
    hasGoodResults
  };
};