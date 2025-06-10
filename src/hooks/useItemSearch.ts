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
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2
    });
  }, []);

  const { filteredItems, suggestions } = useMemo(() => {
    let items = inventoryItems;
    let didYouMeanSuggestions: string[] = [];

    // Apply text search
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      console.log('🔍 Searching database for:', normalizedSearch);
      
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
              const hasMatch = itemWords.some(itemWord => {
                return itemWord.includes(searchWord) || searchWord.includes(itemWord);
              });
              
              if (hasMatch) {
                matchCount++;
              }
            });
            
            const matchRatio = matchCount / searchWords.length;
            if (matchRatio >= 0.6) {
              console.log('✅ Word match found:', item.name, 'match ratio:', matchRatio);
              searchResults.add(item);
            }
          });
        }
      }
      
      // Strategy 5: Generate "Did you mean?" suggestions only if no matches found
      if (searchResults.size === 0) {
        console.log('🔍 No matches found, generating suggestions...');
        
        // Only suggest items that are actually similar to the search term
        const relevantSuggestions = new Set<string>();
        
        // Check for partial word matches that could be suggestions
        const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length >= 2);
        
        inventoryItems.forEach(item => {
          const itemName = item.name.toLowerCase();
          const itemWords = itemName.split(/\s+/);
          
          // Check if any search word partially matches any item word
          let hasRelevantMatch = false;
          
          searchWords.forEach(searchWord => {
            itemWords.forEach(itemWord => {
              // Check for partial matches (at least 3 characters in common)
              if (searchWord.length >= 3 && itemWord.length >= 3) {
                if (itemWord.includes(searchWord.substring(0, 3)) || 
                    searchWord.includes(itemWord.substring(0, 3))) {
                  hasRelevantMatch = true;
                }
              }
              
              // Check for similar starting letters
              if (searchWord.length >= 2 && itemWord.length >= 2) {
                if (searchWord.substring(0, 2) === itemWord.substring(0, 2)) {
                  hasRelevantMatch = true;
                }
              }
            });
          });
          
          if (hasRelevantMatch) {
            relevantSuggestions.add(item.name);
          }
        });
        
        // Also use fuzzy search for suggestions, but only if they're actually relevant
        const fuseResults = fuse.search(searchTerm);
        fuseResults.forEach(result => {
          if (result.score && result.score < 0.7) { // More lenient for suggestions
            relevantSuggestions.add(result.item.name);
          }
        });
        
        // Convert to array and limit to 3 most relevant suggestions
        didYouMeanSuggestions = Array.from(relevantSuggestions).slice(0, 3);
        console.log('💡 Generated suggestions:', didYouMeanSuggestions);
      }
      
      console.log(`📊 Database search complete: ${searchResults.size} matches found`);
      
      // Convert Set back to Array and sort by relevance
      const combinedResults = Array.from(searchResults);
      
      // Sort results by relevance
      combinedResults.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        const aExact = aName === normalizedSearch;
        const bExact = bName === normalizedSearch;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const aContains = aName.includes(normalizedSearch);
        const bContains = bName.includes(normalizedSearch);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        
        const aStarts = aName.startsWith(normalizedSearch);
        const bStarts = bName.startsWith(normalizedSearch);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
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

    return {
      filteredItems: items.slice(0, 50),
      suggestions: didYouMeanSuggestions
    };
  }, [searchTerm, filters, fuse]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

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
    suggestions,
    hasGoodResults
  };
};