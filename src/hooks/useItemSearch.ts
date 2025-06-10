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
      console.log('🔍 Searching database for:', normalizedSearch);
      
      // Enhanced search with multiple strategies
      const searchResults = new Set<InventoryItem>();
      
      // Strategy 1: Exact name matching (highest priority)
      inventoryItems.forEach(item => {
        const itemName = item.name.toLowerCase();
        if (itemName === normalizedSearch) {
          console.log('✅ Exact match found:', item.name);
          searchResults.add(item);
        }
      });
      
      // Strategy 2: Direct substring matching (case insensitive)
      if (searchResults.size === 0) {
        inventoryItems.forEach(item => {
          const itemName = item.name.toLowerCase();
          if (itemName.includes(normalizedSearch)) {
            console.log('✅ Substring match found:', item.name);
            searchResults.add(item);
          }
        });
      }
      
      // Strategy 3: Handle common variations and synonyms
      if (searchResults.size === 0) {
        const searchVariations = {
          // Bed size variations
          'kingsize': ['kingsize bed & mattress', 'kingsize bed', 'kingsize mattress'],
          'king size': ['kingsize bed & mattress', 'kingsize bed', 'kingsize mattress'],
          'king': ['kingsize bed & mattress', 'kingsize bed', 'kingsize mattress'],
          'kingsize bed': ['kingsize bed & mattress'],
          'king size bed': ['kingsize bed & mattress'],
          'king bed': ['kingsize bed & mattress'],
          
          // Other bed sizes
          'double': ['double bed & mattress', 'double mattress', 'double wardrobe'],
          'double bed': ['double bed & mattress'],
          'single': ['single bed & mattress', 'single mattress', 'single wardrobe'],
          'single bed': ['single bed & mattress'],
          
          // Furniture variations
          'sofa': ['two seater sofa', 'three seater sofa', 'four seater sofa'],
          'couch': ['two seater sofa', 'three seater sofa', 'four seater sofa'],
          'wardrobe': ['double wardrobe', 'single wardrobe', 'triple wardrobe'],
          'closet': ['double wardrobe', 'single wardrobe', 'triple wardrobe'],
          'table': ['dining table', 'coffee table', 'side table', 'bedside table', 'dressing table', 'garden table'],
          'dining table': ['4 seater dining table', '6 seater dining table'],
          'coffee table': ['coffee table', 'round coffee table', 'glass coffee table'],
          
          // Chair variations
          'chair': ['dining chair', 'office chair', 'armchair'],
          'dining chair': ['dining chair'],
          'office chair': ['office chair'],
          'armchair': ['armchair'],
          
          // Box variations
          'box': ['large box', 'medium box', 'small box'],
          'large box': ['large box'],
          'medium box': ['medium box'],
          'small box': ['small box'],
          
          // Appliance variations
          'tv': ['small television/tv', 'medium television/tv', 'large television/tv'],
          'television': ['small television/tv', 'medium television/tv', 'large television/tv'],
          'fridge': ['fridge', 'fridge freezer', 'american fridge freezer'],
          'refrigerator': ['fridge', 'fridge freezer', 'american fridge freezer'],
          'washing machine': ['washing machine'],
          'washer': ['washing machine'],
          'dryer': ['tumble dryer'],
          'tumble dryer': ['tumble dryer'],
          
          // Mattress variations
          'mattress': ['double mattress', 'single mattress', 'kingsize mattress'],
          'kingsize mattress': ['kingsize mattress'],
          'double mattress': ['double mattress'],
          'single mattress': ['single mattress'],
          
          // Bag variations
          'bag': ['large bag', 'small bag', 'shopping bags'],
          'suitcase': ['suitcase', 'large suitcase'],
          'shopping bags': ['shopping bags'],
          
          // Desk variations
          'desk': ['desk', 'office desk', 'corner desk with pedestal'],
          'office desk': ['office desk', 'desk'],
          
          // Other common items
          'bicycle': ['bicycle'],
          'bike': ['bicycle'],
          'microwave': ['microwave oven'],
          'oven': ['microwave oven', 'cooker'],
          'cooker': ['cooker'],
          'bookcase': ['bookcase', 'book shelf'],
          'bookshelf': ['bookcase', 'book shelf'],
          'book shelf': ['book shelf', 'bookcase'],
          'sideboard': ['sideboard'],
          'chest of drawers': ['chest of drawers'],
          'drawers': ['chest of drawers'],
          'rug': ['rug'],
          'carpet': ['rug']
        };
        
        // Check variations
        const searchVariants = searchVariations[normalizedSearch] || [];
        console.log('🔄 Checking variants for:', normalizedSearch, '→', searchVariants);
        
        searchVariants.forEach(variant => {
          inventoryItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            if (itemName === variant.toLowerCase() || itemName.includes(variant.toLowerCase())) {
              console.log('✅ Variant match found:', item.name, 'for variant:', variant);
              searchResults.add(item);
            }
          });
        });
      }
      
      // Strategy 4: Word-by-word matching for multi-word searches
      if (searchResults.size === 0) {
        const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 1);
        console.log('🔤 Word matching for:', searchWords);
        
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
            
            // If at least 60% of search words match, include the item
            const matchRatio = matchCount / searchWords.length;
            if (matchRatio >= 0.6) {
              console.log('✅ Word match found:', item.name, 'match ratio:', matchRatio);
              searchResults.add(item);
            }
          });
        }
      }
      
      // Strategy 5: Fuzzy search as fallback (only if no other matches)
      if (searchResults.size === 0) {
        console.log('🔍 No direct matches, trying fuzzy search...');
        const fuseResults = fuse.search(searchTerm);
        console.log('Fuzzy search results:', fuseResults);
        
        fuseResults.forEach(result => {
          if (result.score && result.score < 0.6) { // Strict fuzzy matching
            console.log('✅ Fuzzy match found:', result.item.name, 'score:', result.score);
            searchResults.add(result.item);
          }
        });
      }
      
      // Strategy 6: Partial matching for single words (very lenient, last resort)
      if (searchResults.size === 0 && normalizedSearch.length >= 3) {
        console.log('🔍 Trying partial matching...');
        inventoryItems.forEach(item => {
          const itemName = item.name.toLowerCase();
          // Check if any word in the item name contains the search word
          const itemWords = itemName.split(/\s+/);
          const hasPartialMatch = itemWords.some(word => 
            word.includes(normalizedSearch) || normalizedSearch.includes(word)
          );
          
          if (hasPartialMatch) {
            console.log('✅ Partial match found:', item.name);
            searchResults.add(item);
          }
        });
      }
      
      console.log(`📊 Database search complete: ${searchResults.size} matches found`);
      
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