// src/services/aiInventoryService.ts - Fixed version with proper web lookup functionality

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

class AIInventoryService {
  private cache = new Map<string, WebLookupResult>();
  private pendingItems = new Set<string>();
  private nextItemId = 100000;

  // Main method called by frontend
  async generateAIItem(itemText: string): Promise<AIGeneratedItem | null> {
    try {
      console.log(`🔍 Generating AI item for: ${itemText}`);
      
      const lookupResult = await this.performWebLookup(itemText);
      
      if (lookupResult) {
        return this.createAIItem(lookupResult, itemText);
      }
      
      console.log('❌ No lookup result found');
      return null;
    } catch (error) {
      console.error('Error generating AI item:', error);
      throw new Error(`Web lookup failed: ${error.message}`);
    }
  }

  // Web lookup with Firecrawl backend
  async performWebLookup(itemText: string): Promise<WebLookupResult | null> {
    if (!this.isValidInput(itemText)) {
      throw new Error('Invalid input text');
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
      console.log(`🔍 Starting web lookup for: ${itemText}`);
      
      // Try backend scraping first
      let result = await this.tryBackendScraping(itemText);
      
      if (!result) {
        // Fallback to smart estimation
        result = this.generateSmartEstimate(itemText);
      }
      
      if (result) {
        this.cache.set(cacheKey, result);
      }
      
      return result;
    } finally {
      this.pendingItems.delete(cacheKey);
    }
  }

  // Backend scraping with Firecrawl
  private async tryBackendScraping(itemText: string): Promise<WebLookupResult | null> {
    try {
      console.log('🔥 Trying Firecrawl backend scraping...');
      
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://localhost:3001/api/scrape-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.name && data.weight > 0) {
        console.log('✅ Backend scraping successful:', data.name);
        return this.transformBackendResult(data, itemText);
      }
      
      console.log('❌ Backend returned invalid data');
      return null;

    } catch (error) {
      console.log('❌ Backend scraping failed:', error.message);
      return null;
    }
  }

  // Smart estimation fallback
  private generateSmartEstimate(itemText: string): WebLookupResult {
    console.log('🧠 Generating smart estimate...');
    
    const category = this.categorizeItem(itemText);
    const weight = this.estimateRealisticWeight(itemText, category);
    const dimensions = this.estimateRealisticDimensions(itemText, category);

    return {
      name: this.capitalizeWords(itemText),
      weight,
      dimensions: this.formatDimensions(dimensions),
      category,
      confidence: 0.65,
      source: 'Smart Estimation',
      description: `Estimated specifications for ${itemText}`,
    };
  }

  // Weight estimation method (was missing)
  estimateRealisticWeight(itemText: string, category?: string): number {
    const text = itemText.toLowerCase();
    
    // Try to extract weight from text first
    const extractedWeight = this.extractWeightFromText(text);
    if (extractedWeight) {
      return extractedWeight;
    }

    // Category-based estimation
    const itemCategory = category || this.categorizeItem(itemText);
    let baseWeight = this.getBaseWeightByCategory(itemCategory);
    
    // Apply size modifiers
    if (text.includes('large') || text.includes('big')) baseWeight *= 1.5;
    if (text.includes('small') || text.includes('mini')) baseWeight *= 0.6;
    if (text.includes('double') || text.includes('king')) baseWeight *= 1.4;
    
    // Material modifiers
    if (text.includes('metal') || text.includes('steel')) baseWeight *= 1.8;
    if (text.includes('plastic')) baseWeight *= 0.7;
    if (text.includes('wood') || text.includes('wooden')) baseWeight *= 1.2;
    
    // Specific item adjustments
    if (text.includes('piano')) return Math.max(baseWeight, 180);
    if (text.includes('safe')) return Math.max(baseWeight, 120);
    if (text.includes('pool table')) return Math.max(baseWeight, 300);
    if (text.includes('treadmill')) return Math.max(baseWeight, 85);
    if (text.includes('freezer')) return Math.max(baseWeight, 65);
    if (text.includes('exercise bike')) return Math.max(baseWeight, 45);
    
    return Math.max(0.5, Math.min(baseWeight, 1000)); // Reasonable bounds
  }

  // Dimensions estimation method
  private estimateRealisticDimensions(itemText: string, category: string): { height: number; width: number; depth: number } {
    const text = itemText.toLowerCase();
    
    // Predefined dimensions for common items
    const commonItems = {
      'table': { height: 75, width: 140, depth: 80 },
      'chair': { height: 90, width: 60, depth: 50 },
      'bed': { height: 50, width: 200, depth: 140 },
      'sofa': { height: 85, width: 180, depth: 90 },
      'fridge': { height: 180, width: 60, depth: 65 },
      'freezer': { height: 140, width: 70, depth: 85 },
      'tv': { height: 70, width: 109, depth: 30 },
      'exercise bike': { height: 140, width: 110, depth: 50 },
      'treadmill': { height: 140, width: 180, depth: 80 },
      'piano': { height: 110, width: 150, depth: 60 },
    };

    // Check for specific items
    for (const [item, dims] of Object.entries(commonItems)) {
      if (text.includes(item)) {
        return this.applySizeModifiers(dims, text);
      }
    }

    // Category-based fallback
    let baseDims = this.getBaseDimensionsByCategory(category);
    return this.applySizeModifiers(baseDims, text);
  }

  // Helper methods
  private applySizeModifiers(dims: { height: number; width: number; depth: number }, text: string) {
    let multiplier = 1.0;
    
    if (text.includes('large') || text.includes('big')) multiplier = 1.4;
    if (text.includes('small') || text.includes('mini')) multiplier = 0.7;
    if (text.includes('double') || text.includes('king')) multiplier = 1.3;
    
    return {
      height: Math.round(dims.height * multiplier),
      width: Math.round(dims.width * multiplier),
      depth: Math.round(dims.depth * multiplier),
    };
  }

  private extractWeightFromText(text: string): number | null {
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)/gi,
      /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)/gi,
    ];
    
    for (const pattern of weightPatterns) {
      const match = pattern.exec(text);
      if (match) {
        let weight = parseFloat(match[1]);
        if (text.includes('lb') || text.includes('pound')) {
          weight = weight * 0.453592; // Convert to kg
        }
        if (weight >= 0.1 && weight <= 1000) {
          return Math.round(weight * 10) / 10;
        }
      }
    }
    return null;
  }

  private getBaseWeightByCategory(category: string): number {
    switch (category) {
      case 'furniture': return 35;
      case 'appliances': return 80;
      case 'electronics': return 20;
      case 'exercise': return 50;
      case 'tools': return 15;
      default: return 20;
    }
  }

  private getBaseDimensionsByCategory(category: string): { height: number; width: number; depth: number } {
    switch (category) {
      case 'furniture': return { height: 80, width: 120, depth: 60 };
      case 'appliances': return { height: 150, width: 60, depth: 60 };
      case 'electronics': return { height: 50, width: 80, depth: 30 };
      case 'exercise': return { height: 120, width: 150, depth: 70 };
      default: return { height: 80, width: 80, depth: 60 };
    }
  }

  private categorizeItem(itemText: string): string {
    const text = itemText.toLowerCase();
    
    const categories = {
      furniture: ['table', 'chair', 'bed', 'sofa', 'cabinet', 'wardrobe', 'desk', 'shelf'],
      appliances: ['fridge', 'freezer', 'washer', 'dryer', 'dishwasher', 'oven', 'microwave'],
      electronics: ['tv', 'computer', 'laptop', 'monitor', 'speaker', 'phone'],
      exercise: ['bike', 'treadmill', 'weights', 'bench', 'machine'],
      tools: ['saw', 'drill', 'hammer', 'screwdriver'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'misc';
  }

  private transformBackendResult(data: any, originalText: string): WebLookupResult {
    return {
      name: data.name || this.capitalizeWords(originalText),
      weight: data.weight || 0,
      dimensions: data.dimensions || 'Variable',
      category: data.category || 'misc',
      confidence: data.confidence || 0.7,
      source: data.source || 'Web Scraping',
      description: data.description,
      specifications: data.specifications,
    };
  }

  // Create AI item from lookup result
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
    return { height: 80, width: 80, depth: 60 }; // Default fallback
  }

  // Utility methods
  private isValidInput(itemText: string): boolean {
    return typeof itemText === 'string' && 
           itemText.trim().length > 0 && 
           itemText.trim().length < 100;
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