// src/services/aiInventoryService.ts - Simplified to use only database or Firecrawl

import { inventoryItems } from '../data/inventoryItems';

export interface WebLookupResult {
  name: string;
  weight: number;
  dimensions: string;
  category: string;
  confidence: number;
  source: string;
  description?: string;
}

export interface AIGeneratedItem {
  id: number;
  name: string;
  weight: number;
  height: number;
  depth: number;
  width: number;
  volume: number;
  rank: number;
  type: 'ai-generated';
  confidence: number;
  source: string;
  originalText: string;
  description?: string;
}

class AIInventoryService {
  private cache = new Map<string, WebLookupResult>();
  private nextItemId = 100000;

  // Main method - only uses database or Firecrawl
  async generateAIItem(itemText: string): Promise<AIGeneratedItem | null> {
    try {
      console.log(`🔍 Generating AI item for: ${itemText}`);
      
      // Step 1: Try database first
      const databaseResult = this.searchDatabase(itemText);
      if (databaseResult) {
        console.log('✅ Found in database:', databaseResult.name);
        return this.createAIItem(databaseResult, itemText);
      }
      
      // Step 2: Try Firecrawl backend
      const firecrawlResult = await this.tryFirecrawl(itemText);
      if (firecrawlResult) {
        console.log('✅ Found via Firecrawl:', firecrawlResult.name);
        return this.createAIItem(firecrawlResult, itemText);
      }
      
      console.log('❌ No results found in database or Firecrawl');
      return null;
      
    } catch (error) {
      console.error('Error generating AI item:', error);
      return null;
    }
  }

  // Search existing database
  private searchDatabase(itemText: string): WebLookupResult | null {
    const searchTerm = itemText.toLowerCase().trim();
    console.log(`🗄️ Searching database for: ${searchTerm}`);
    
    // Direct name matching
    let bestMatch = inventoryItems.find(item => 
      item.name.toLowerCase() === searchTerm
    );
    
    if (!bestMatch) {
      // Partial matching
      bestMatch = inventoryItems.find(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        searchTerm.includes(item.name.toLowerCase())
      );
    }
    
    if (!bestMatch) {
      // Word-based matching
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 2);
      bestMatch = inventoryItems.find(item => {
        const itemWords = item.name.toLowerCase().split(/\s+/);
        return searchWords.some(searchWord => 
          itemWords.some(itemWord => 
            itemWord.includes(searchWord) || searchWord.includes(itemWord)
          )
        );
      });
    }
    
    if (bestMatch) {
      return {
        name: bestMatch.name,
        weight: bestMatch.weight,
        dimensions: `${bestMatch.height}×${bestMatch.width}×${bestMatch.depth}cm`,
        category: this.categorizeFromName(bestMatch.name),
        confidence: 0.95,
        source: 'Database',
        description: `Database item: ${bestMatch.name}`
      };
    }
    
    return null;
  }

  // Use Firecrawl backend
  private async tryFirecrawl(itemText: string): Promise<WebLookupResult | null> {
    try {
      console.log('🔥 Trying Firecrawl backend...');
      
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('http://localhost:3001/api/scrape-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.log(`❌ Firecrawl HTTP error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      // Validate Firecrawl response
      if (data && data.name && data.weight > 0) {
        return {
          name: data.name,
          weight: data.weight,
          dimensions: data.dimensions || 'Variable',
          category: data.category || 'misc',
          confidence: data.confidence || 0.8,
          source: data.source || 'Firecrawl',
          description: data.description
        };
      }
      
      console.log('❌ Firecrawl returned invalid data');
      return null;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('❌ Firecrawl request timed out');
      } else {
        console.log('❌ Firecrawl error:', error.message);
      }
      return null;
    }
  }

  // Create AI item from lookup result
  private createAIItem(result: WebLookupResult, originalText: string): AIGeneratedItem {
    const dimensions = this.parseDimensions(result.dimensions);
    const volume = dimensions.height * dimensions.width * dimensions.depth;

    return {
      id: this.nextItemId++,
      name: result.name,
      weight: result.weight,
      height: dimensions.height,
      width: dimensions.width,
      depth: dimensions.depth,
      volume,
      rank: Math.round((result.weight * 10) + (volume / 1000)),
      type: 'ai-generated',
      confidence: result.confidence,
      source: result.source,
      originalText,
      description: result.description
    };
  }

  // Helper methods
  private parseDimensions(dimensionsStr: string): { height: number; width: number; depth: number } {
    const match = dimensionsStr.match(/(\d+)×(\d+)×(\d+)/);
    if (match) {
      return {
        height: parseInt(match[1]),
        width: parseInt(match[2]),
        depth: parseInt(match[3]),
      };
    }
    // Default fallback dimensions
    return { height: 50, width: 50, depth: 50 };
  }

  private categorizeFromName(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('table') || lowerName.includes('chair') || 
        lowerName.includes('bed') || lowerName.includes('sofa') || 
        lowerName.includes('wardrobe') || lowerName.includes('desk')) {
      return 'furniture';
    }
    
    if (lowerName.includes('fridge') || lowerName.includes('freezer') || 
        lowerName.includes('washing') || lowerName.includes('dryer') || 
        lowerName.includes('cooker') || lowerName.includes('microwave')) {
      return 'appliances';
    }
    
    if (lowerName.includes('tv') || lowerName.includes('television') || 
        lowerName.includes('computer') || lowerName.includes('monitor')) {
      return 'electronics';
    }
    
    if (lowerName.includes('exercise') || lowerName.includes('bike') || 
        lowerName.includes('treadmill') || lowerName.includes('weights')) {
      return 'fitness';
    }
    
    return 'misc';
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const aiInventoryService = new AIInventoryService();
export default aiInventoryService;