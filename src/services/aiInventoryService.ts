// src/services/aiInventoryService.ts - REPLACE your existing file with this cleaned version

// Types (keep your existing interface exports)
export interface WebLookupResult {
  name: string;
  weight: number;
  dimensions: string;
  category: string;
  confidence: number;
  source: string;
  description?: string;
  specifications?: Record<string, unknown>;
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
  specifications?: Record<string, unknown>;
  description?: string;
}

// Constants - extracted from your scattered magic numbers
const CONSTANTS = {
  TIMEOUTS: {
    BACKEND_SCRAPER: 10000,
    WIKIPEDIA: 8000,
    DEFAULT: 5000,
  },
  CONFIDENCE: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5,
    FALLBACK: 0.65,
  },
  ENDPOINTS: {
    BACKEND_SCRAPER: 'http://localhost:3001/api/scrape-item',
    WIKIPEDIA: 'https://en.wikipedia.org/api/rest_v1/page/summary',
  },
  DIMENSIONS: {
    // Common item dimensions (height x width x depth)
    TABLE: { height: 75, width: 140, depth: 80 },
    CHAIR: { height: 90, width: 60, depth: 50 },
    BED: { height: 50, width: 200, depth: 140 },
    SOFA: { height: 85, width: 180, depth: 90 },
    FRIDGE: { height: 180, width: 60, depth: 65 },
    TV_MEDIUM: { height: 70, width: 109, depth: 30 },
    DEFAULT: { height: 80, width: 80, depth: 60 },
  },
  WEIGHTS: {
    // Base weights by category (kg)
    FURNITURE_LIGHT: 15,
    FURNITURE_MEDIUM: 35,
    FURNITURE_HEAVY: 75,
    APPLIANCE_SMALL: 25,
    APPLIANCE_LARGE: 80,
    ELECTRONICS: 20,
    DEFAULT: 20,
  },
} as const;

class AIInventoryService {
  private cache = new Map<string, WebLookupResult>();
  private pendingItems = new Set<string>();
  private nextItemId = 100000;

  // Main lookup method - simplified and broken down
  async performWebLookup(itemText: string): Promise<WebLookupResult | null> {
    if (!this.isValidInput(itemText)) {
      return null;
    }

    const cacheKey = this.createCacheKey(itemText);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for:', itemText);
      return cached;
    }

    // Prevent duplicate requests
    if (this.pendingItems.has(cacheKey)) {
      console.log('⏳ Request pending for:', itemText);
      return null;
    }

    this.pendingItems.add(cacheKey);
    
    try {
      console.log(`🔍 Starting lookup for: ${itemText}`);
      
      const result = await this.executeLookupStrategies(itemText);
      
      if (result) {
        this.cache.set(cacheKey, result);
      }
      
      return result;
    } finally {
      this.pendingItems.delete(cacheKey);
    }
  }

  // Missing method that frontend is calling
  async generateAIItem(itemText: string): Promise<AIGeneratedItem | null> {
    try {
      const lookupResult = await this.performWebLookup(itemText);
      
      if (lookupResult) {
        return this.createAIItem(lookupResult, itemText);
      }
      
      return null;
    } catch (error) {
      console.error('Error generating AI item:', error);
      return null;
    }
  }

  // Execute lookup strategies in order of preference
  private async executeLookupStrategies(itemText: string): Promise<WebLookupResult | null> {
    const strategies = [
      () => this.tryBackendScraping(itemText),
      () => this.tryWikipediaSearch(itemText),
      () => this.generateSmartEstimate(itemText),
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result && this.isValidResult(result)) {
          return result;
        }
      } catch (error) {
        console.warn('Strategy failed:', error);
      }
    }

    return null;
  }

  // Backend scraping - cleaned up
  private async tryBackendScraping(itemText: string): Promise<WebLookupResult | null> {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), CONSTANTS.TIMEOUTS.BACKEND_SCRAPER);

      const response = await fetch(CONSTANTS.ENDPOINTS.BACKEND_SCRAPER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return this.transformBackendResult(data, itemText);

    } catch (error) {
      console.log('Backend scraping failed:', error.message);
      return null;
    }
  }

  // Wikipedia search - simplified
  private async tryWikipediaSearch(itemText: string): Promise<WebLookupResult | null> {
    try {
      const searchTerms = this.generateSearchTerms(itemText);
      
      for (const term of searchTerms.slice(0, 3)) { // Limit to 3 attempts
        const url = `${CONSTANTS.ENDPOINTS.WIKIPEDIA}/${encodeURIComponent(term)}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          if (data.extract && data.extract.length > 50) {
            return this.transformWikipediaResult(data, itemText);
          }
        }
      }
      return null;
    } catch (error) {
      console.log('Wikipedia search failed:', error.message);
      return null;
    }
  }

  // Smart estimation - much cleaner
  private generateSmartEstimate(itemText: string): WebLookupResult {
    const category = this.categorizeItem(itemText);
    const weight = this.estimateWeight(itemText, category);
    const dimensions = this.estimateDimensions(itemText, category);

    return {
      name: this.capitalizeWords(itemText),
      weight,
      dimensions: this.formatDimensions(dimensions),
      category,
      confidence: CONSTANTS.CONFIDENCE.FALLBACK,
      source: 'Smart Estimation',
      description: `Estimated specifications for ${itemText}`,
    };
  }

  // Weight estimation - extracted and simplified
  private estimateWeight(itemText: string, category: string): number {
    const text = itemText.toLowerCase();
    
    // Try to extract weight from text first
    const extractedWeight = this.extractNumberFromText(text, ['kg', 'kilogram', 'lb', 'pound']);
    if (extractedWeight) {
      return text.includes('lb') || text.includes('pound') ? 
        extractedWeight * 0.453592 : extractedWeight;
    }

    // Category-based estimation
    let baseWeight = this.getBaseWeightByCategory(category);
    
    // Apply size modifiers
    if (text.includes('large') || text.includes('big')) baseWeight *= 1.5;
    if (text.includes('small') || text.includes('mini')) baseWeight *= 0.6;
    
    // Material modifiers
    if (text.includes('metal') || text.includes('steel')) baseWeight *= 1.8;
    if (text.includes('plastic')) baseWeight *= 0.7;
    
    return Math.max(0.1, Math.min(baseWeight, 1000)); // Reasonable bounds
  }

  // Dimensions estimation - extracted and simplified
  private estimateDimensions(itemText: string, category: string): { height: number; width: number; depth: number } {
    const text = itemText.toLowerCase();
    
    // Check for specific items
    if (text.includes('table')) return CONSTANTS.DIMENSIONS.TABLE;
    if (text.includes('chair')) return CONSTANTS.DIMENSIONS.CHAIR;
    if (text.includes('bed')) return CONSTANTS.DIMENSIONS.BED;
    if (text.includes('sofa')) return CONSTANTS.DIMENSIONS.SOFA;
    if (text.includes('fridge')) return CONSTANTS.DIMENSIONS.FRIDGE;
    if (text.includes('tv')) return CONSTANTS.DIMENSIONS.TV_MEDIUM;

    // Category-based fallback
    let baseDims = CONSTANTS.DIMENSIONS.DEFAULT;
    
    // Apply size modifiers
    if (text.includes('large') || text.includes('big')) {
      baseDims = {
        height: Math.round(baseDims.height * 1.4),
        width: Math.round(baseDims.width * 1.4),
        depth: Math.round(baseDims.depth * 1.4),
      };
    }
    if (text.includes('small') || text.includes('mini')) {
      baseDims = {
        height: Math.round(baseDims.height * 0.7),
        width: Math.round(baseDims.width * 0.7),
        depth: Math.round(baseDims.depth * 0.7),
      };
    }

    return baseDims;
  }

  // Item categorization - simplified
  private categorizeItem(itemText: string): string {
    const text = itemText.toLowerCase();
    
    const categories = {
      furniture: ['table', 'chair', 'bed', 'sofa', 'cabinet', 'wardrobe', 'desk'],
      appliances: ['fridge', 'freezer', 'washer', 'dryer', 'dishwasher', 'oven', 'microwave'],
      electronics: ['tv', 'computer', 'laptop', 'monitor', 'speaker'],
      tools: ['saw', 'drill', 'hammer', 'screwdriver'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'misc';
  }

  // Helper methods - cleaned up
  private getBaseWeightByCategory(category: string): number {
    switch (category) {
      case 'furniture': return CONSTANTS.WEIGHTS.FURNITURE_MEDIUM;
      case 'appliances': return CONSTANTS.WEIGHTS.APPLIANCE_LARGE;
      case 'electronics': return CONSTANTS.WEIGHTS.ELECTRONICS;
      default: return CONSTANTS.WEIGHTS.DEFAULT;
    }
  }

  private transformBackendResult(data: any, originalText: string): WebLookupResult {
    return {
      name: data.name || this.capitalizeWords(originalText),
      weight: data.weight || 0,
      dimensions: data.dimensions || 'Variable',
      category: data.category || 'misc',
      confidence: data.confidence || CONSTANTS.CONFIDENCE.MEDIUM,
      source: data.source || 'Web Scraping',
      description: data.description,
      specifications: data.specifications,
    };
  }

  private transformWikipediaResult(data: any, itemText: string): WebLookupResult {
    const category = this.categorizeItem(itemText);
    const weight = this.estimateWeight(itemText, category);
    const dimensions = this.estimateDimensions(itemText, category);

    return {
      name: data.title,
      weight,
      dimensions: this.formatDimensions(dimensions),
      category,
      confidence: data.extract.length > 200 ? CONSTANTS.CONFIDENCE.HIGH : CONSTANTS.CONFIDENCE.MEDIUM,
      source: 'Wikipedia',
      description: data.extract.substring(0, 200) + '...',
    };
  }

  private generateSearchTerms(itemText: string): string[] {
    const terms = [itemText];
    const words = itemText.toLowerCase().split(/\s+/);
    
    // Add significant individual words
    words.filter(word => word.length > 3).forEach(word => terms.push(word));
    
    // Add combinations
    if (words.length > 1) {
      terms.push(words.slice(0, 2).join(' '));
    }

    return [...new Set(terms)];
  }

  // Utility methods
  private isValidInput(itemText: string): boolean {
    return typeof itemText === 'string' && 
           itemText.trim().length > 0 && 
           itemText.trim().length < 100;
  }

  private isValidResult(result: WebLookupResult): boolean {
    return result.confidence >= CONSTANTS.CONFIDENCE.FALLBACK &&
           result.weight > 0 &&
           result.name.length > 0;
  }

  private createCacheKey(itemText: string): string {
    return itemText.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private capitalizeWords(text: string): string {
    return text.replace(/\b\w/g, char => char.toUpperCase());
  }

  private formatDimensions(dims: { height: number; width: number; depth: number }): string {
    return `${dims.height}×${dims.width}×${dims.depth}cm`;
  }

  private extractNumberFromText(text: string, units: string[]): number | null {
    for (const unit of units) {
      const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`, 'i');
      const match = text.match(regex);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    return null;
  }

  // Public method to create AI items (keep your existing interface)
  createAIItem(result: WebLookupResult, originalText: string): AIGeneratedItem {
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
      description: result.description,
      specifications: result.specifications,
    };
  }

  private parseDimensions(dimensionsStr: string): { height: number; width: number; depth: number } {
    const match = dimensionsStr.match(/(\d+)×(\d+)×(\d+)/);
    if (match) {
      return {
        height: parseInt(match[1]),
        width: parseInt(match[2]),
        depth: parseInt(match[3]),
      };
    }
    return CONSTANTS.DIMENSIONS.DEFAULT;
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance (maintains your existing pattern)
export default new AIInventoryService();