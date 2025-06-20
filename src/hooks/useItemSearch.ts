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
      
      // Strategy 3: Smart word matching for quantity + item combinations
      if (searchResults.size === 0) {
        // Extract quantity and item from search (e.g., "6 dining chairs" -> "dining chairs")
        const quantityMatch = normalizedSearch.match(/^(\d+)\s+(.+)$/);
        if (quantityMatch) {
          const itemPart = quantityMatch[2];
          console.log('🔢 Extracted item part from quantity search:', itemPart);
          
          inventoryItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            
            // Check if the item part matches the item name
            if (itemName.includes(itemPart) || itemPart.includes(itemName)) {
              console.log('✅ Quantity-based match found:', item.name);
              searchResults.add(item);
            }
            
            // Handle plurals - check singular forms
            const singularItemPart = itemPart.replace(/s$/, ''); // Simple plural handling
            if (itemName.includes(singularItemPart) || singularItemPart.includes(itemName)) {
              console.log('✅ Singular form match found:', item.name);
              searchResults.add(item);
            }
          });
        }
      }
      
      // Strategy 4: Handle common variations and synonyms
      if (searchResults.size === 0) {
        const searchVariations: { [key: string]: string[] } = {
          'sofa': ['sofa', 'couch', 'settee'],
          'couch': ['sofa', 'couch', 'settee'],
          'settee': ['sofa', 'couch', 'settee'],
          'chair': ['chair', 'seat'],
          'chairs': ['chair', 'seat'],
          'dining chair': ['dining chair', 'chair'],
          'dining chairs': ['dining chair', 'chair'],
          'table': ['table', 'desk'],
          'desk': ['table', 'desk'],
          'bed': ['bed', 'mattress'],
          'mattress': ['bed', 'mattress'],
          'wardrobe': ['wardrobe', 'closet'],
          'closet': ['wardrobe', 'closet'],
          'drawer': ['drawer', 'chest'],
          'chest': ['drawer', 'chest'],
          'tv': ['tv', 'television'],
          'television': ['tv', 'television'],
          'box': ['box', 'container'],
          'container': ['box', 'container'],
          'rug': ['rug', 'carpet'],
          'carpet': ['rug', 'carpet']
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
      
      // Strategy 5: Word-by-word matching for multi-word searches
      if (searchResults.size === 0) {
        const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 1);
        console.log('🔤 Word matching for:', searchWords);
        
        if (searchWords.length > 0) {
          inventoryItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            const itemWords = itemName.split(/\s+/);
            
            let matchCount = 0;
            searchWords.forEach(searchWord => {
              // Skip numbers when doing word matching
              if (/^\d+$/.test(searchWord)) return;
              
              const hasMatch = itemWords.some(itemWord => {
                return itemWord.includes(searchWord) || searchWord.includes(itemWord);
              });
              
              if (hasMatch) {
                matchCount++;
              }
            });
            
            const nonNumericWords = searchWords.filter(word => !/^\d+$/.test(word));
            const matchRatio = nonNumericWords.length > 0 ? matchCount / nonNumericWords.length : 0;
            
            if (matchRatio >= 0.6) {
              console.log('✅ Word match found:', item.name, 'match ratio:', matchRatio);
              searchResults.add(item);
            }
          });
        }
      }
      
      // Strategy 6: Generate "Did you mean?" suggestions ONLY if no matches found AND search is relevant
      if (searchResults.size === 0 && normalizedSearch.length >= 3) {
        console.log('🔍 No matches found, generating relevant suggestions...');
        
        const relevantSuggestions = new Set<string>();
        
        // Extract the main item part (remove quantities)
        let searchForSuggestions = normalizedSearch;
        const quantityMatch = normalizedSearch.match(/^(\d+)\s+(.+)$/);
        if (quantityMatch) {
          searchForSuggestions = quantityMatch[2];
        }
        
        const searchWords = searchForSuggestions.split(/\s+/).filter(word => word.length >= 3);
        
        // Only generate suggestions if the search term has meaningful content
        if (searchWords.length > 0) {
          // Check for items that share significant character sequences with the search term
          inventoryItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            let relevanceScore = 0;
            
            // Check each search word against each word in the item name
            searchWords.forEach(searchWord => {
              const itemWords = itemName.split(/\s+/);
              
              itemWords.forEach(itemWord => {
                // Calculate character overlap
                let overlapCount = 0;
                const minLength = Math.min(searchWord.length, itemWord.length);
                
                // Check for common starting characters
                for (let i = 0; i < minLength; i++) {
                  if (searchWord[i] === itemWord[i]) {
                    overlapCount++;
                  } else {
                    break;
                  }
                }
                
                // Check for substring matches
                if (itemWord.includes(searchWord) || searchWord.includes(itemWord)) {
                  overlapCount += 3;
                }
                
                // Check for similar character patterns
                if (overlapCount >= 3 || (overlapCount >= 2 && minLength <= 4)) {
                  relevanceScore += overlapCount;
                }
              });
            });
            
            // Only suggest items with meaningful relevance to the search term
            if (relevanceScore >= 4) {
              relevantSuggestions.add(item.name);
            }
          });
          
          // Also use fuzzy search but with stricter relevance criteria
          const fuseResults = fuse.search(searchForSuggestions);
          fuseResults.forEach(result => {
            if (result.score && result.score < 0.5) { // Stricter threshold
              const itemName = result.item.name.toLowerCase();
              
              // Additional relevance check - ensure the suggestion actually relates to the search
              let hasRelevantConnection = false;
              searchWords.forEach(searchWord => {
                if (itemName.includes(searchWord.substring(0, Math.min(3, searchWord.length)))) {
                  hasRelevantConnection = true;
                }
              });
              
              if (hasRelevantConnection) {
                relevantSuggestions.add(result.item.name);
              }
            }
          });
        }
        
        // Convert to array and limit to 3 most relevant suggestions
        didYouMeanSuggestions = Array.from(relevantSuggestions).slice(0, 3);
        console.log('💡 Generated relevant suggestions:', didYouMeanSuggestions);
      }
      
      console.log(`📊 Database search complete: ${searchResults.size} matches found`);
      
      // Convert Set back to Array and sort by relevance
      const combinedResults = Array.from(searchResults);
      
      // Sort results by relevance
      combinedResults.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Extract item part for comparison (remove quantities)
        let searchForComparison = normalizedSearch;
        const quantityMatch = normalizedSearch.match(/^(\d+)\s+(.+)$/);
        if (quantityMatch) {
          searchForComparison = quantityMatch[2];
        }
        
        const aExact = aName === searchForComparison;
        const bExact = bName === searchForComparison;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const aContains = aName.includes(searchForComparison);
        const bContains = bName.includes(searchForComparison);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        
        const aStarts = aName.startsWith(searchForComparison);
        const bStarts = bName.startsWith(searchForComparison);
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