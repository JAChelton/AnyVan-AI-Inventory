export interface WebLookupResult {
  name: string;
  weight: number;
  dimensions: string;
  category: string;
  confidence: number;
  source: string;
  description?: string;
  specifications?: any;
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
  specifications?: any;
  description?: string;
}

class AIInventoryService {
  private pendingItems = new Set<string>();
  private nextItemId = 100000;

  async performWebLookup(itemText: string): Promise<WebLookupResult | null> {
    console.log(`Starting REAL web scraping API call for: ${itemText}`);
    
    try {
      // Call backend scraping service
      const response = await fetch('http://localhost:3001/api/scrape-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemText })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Backend scraping successful:', result);
      
      return {
        name: result.name,
        weight: result.weight,
        dimensions: result.dimensions || 'Variable',
        category: result.category || 'misc',
        confidence: result.confidence || 0.70,
        source: result.source || 'Web Scraping',
        description: result.description,
        specifications: result.specifications
      };
      
    } catch (error) {
      console.error('Backend scraping failed, trying frontend fallbacks:', error);
      
      // Fallback to frontend methods if backend fails
      try {
        const wikiResult = await this.searchWikipediaAPI(itemText);
        if (wikiResult) return wikiResult;
        
        return this.getRealisticEstimate(itemText);
        
      } catch (fallbackError) {
        console.error('All scraping methods failed:', fallbackError);
        return null;
      }
    }
  }

  private async searchWikipediaAPI(itemText: string): Promise<WebLookupResult | null> {
    try {
      console.log(`🔍 Searching Wikipedia API for: ${itemText}`);
      
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(itemText)}&limit=3&namespace=0&format=json&origin=*`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData[1] && searchData[1].length > 0) {
        const title = searchData[1][0];
        
        const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;
        const contentResponse = await fetch(contentUrl);
        const contentData = await contentResponse.json();
        
        const pages = contentData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId]?.extract;
        
        if (extract) {
          console.log(`Found Wikipedia content for "${title}"`);
          
          const weight = this.extractWeightFromText(extract.toLowerCase());
          const dimensions = this.extractDimensionsFromText(extract.toLowerCase());
          const category = this.categorizeFromText(extract.toLowerCase(), itemText);
          
          return {
            name: this.capitalizeWords(itemText),
            weight: weight || this.estimateRealisticWeight(itemText),
            dimensions: dimensions,
            category: category,
            confidence: weight ? 0.90 : 0.75,
            source: 'Wikipedia',
            description: extract.substring(0, 150) + '...'
          };
        }
      }
    } catch (error) {
      console.log('Wikipedia API failed:', error.message);
    }
    return null;
  }

  private getRealisticEstimate(itemText: string): WebLookupResult {
    return {
      name: this.capitalizeWords(itemText),
      weight: this.estimateRealisticWeight(itemText),
      dimensions: 'Variable',
      category: this.categorizeFromText('', itemText),
      confidence: 0.60,
      source: 'Estimated'
    };
  }

  private extractWeightFromText(text: string): number | null {
    const weightPatterns = [
      /(?:weighs?|weight|mass)[\s:]*(?:about|around|approximately|roughly)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)/gi,
      /(?:weighs?|weight|mass)[\s:]*(?:about|around|approximately|roughly)?\s*(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)/gi,
      /(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)(?:\s+(?:in\s+)?weight)?/gi,
      /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)(?:\s+(?:in\s+)?weight)?/gi,
      /weight[\s:]+(\d+(?:\.\d+)?)\s*(?:kg|lb)/gi
    ];
    
    for (const pattern of weightPatterns) {
      pattern.lastIndex = 0;
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        let weight = parseFloat(match[1]);
        
        if (match[0].toLowerCase().includes('lb') || match[0].toLowerCase().includes('pound')) {
          weight = weight * 0.453592;
        }
        
        if (weight >= 0.5 && weight <= 5000) {
          return Math.round(weight);
        }
      }
    }
    
    return null;
  }

  private extractDimensionsFromText(text: string): string {
    const dimensionPatterns = [
      /(?:dimensions?|size|measures?)[\s:]*(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(?:x|×|by)?\s*(\d+(?:\.\d+)?)?\s*(?:cm|mm|m|inch|ft)/gi,
      /(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(?:x|×)?\s*(\d+(?:\.\d+)?)?\s*(?:cm|mm)/gi
    ];
    
    for (const pattern of dimensionPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const dim1 = Math.round(parseFloat(match[1]));
        const dim2 = Math.round(parseFloat(match[2]));
        const dim3 = match[3] ? Math.round(parseFloat(match[3])) : null;
        
        if (dim1 > 0 && dim2 > 0) {
          let dimensions = `${dim1}×${dim2}`;
          if (dim3 && dim3 > 0) {
            dimensions += `×${dim3}`;
          }
          return dimensions + 'cm';
        }
      }
    }
    
    return 'Variable';
  }

  private categorizeFromText(text: string, itemText: string): string {
    const lowerText = text.toLowerCase();
    const lowerItem = itemText.toLowerCase();
    
    const categoryKeywords = {
      'musical': ['music', 'instrument', 'piano', 'guitar', 'drum'],
      'fitness': ['exercise', 'fitness', 'gym', 'workout', 'training'],
      'furniture': ['furniture', 'table', 'chair', 'sofa', 'bed'],
      'appliances': ['appliance', 'machine', 'electronic', 'kitchen'],
      'outdoor': ['garden', 'outdoor', 'patio', 'yard', 'shed'],
      'tools': ['tool', 'equipment', 'workshop', 'construction']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerItem.includes(keyword) || lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'misc';
  }

  private estimateRealisticWeight(itemText: string): number {
    const lowerText = itemText.toLowerCase();
    let baseWeight = 20;
    
    if (lowerText.includes('piano')) return 180;
    if (lowerText.includes('treadmill')) return 85;
    if (lowerText.includes('safe')) return 120;
    if (lowerText.includes('pool table')) return 300;
    if (lowerText.includes('exercise bike')) return 45;
    
    if (lowerText.includes('large')) baseWeight *= 2;
    if (lowerText.includes('small')) baseWeight *= 0.5;
    if (lowerText.includes('heavy')) baseWeight *= 3;
    
    return Math.max(1, Math.round(baseWeight));
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  private parseDimensions(dimensionString: string): { height: number; width: number; depth: number; volume: number } {
    if (dimensionString === 'Variable') {
      return { height: 50, width: 50, depth: 50, volume: 125000 };
    }

    const match = dimensionString.match(/(\d+)×(\d+)(?:×(\d+))?/);
    if (match) {
      const dim1 = parseInt(match[1]);
      const dim2 = parseInt(match[2]);
      const dim3 = match[3] ? parseInt(match[3]) : dim1;
      
      return {
        height: Math.max(dim1, dim2, dim3),
        width: Math.min(dim1, dim2),
        depth: dim3,
        volume: dim1 * dim2 * dim3
      };
    }

    return { height: 50, width: 50, depth: 50, volume: 125000 };
  }

  async generateAIItem(itemText: string): Promise<AIGeneratedItem | null> {
    if (this.pendingItems.has(itemText.toLowerCase())) {
      return null;
    }
    
    this.pendingItems.add(itemText.toLowerCase());
    
    try {
      const webSearchData = await this.performWebLookup(itemText);
      
      if (webSearchData) {
        const dimensions = this.parseDimensions(webSearchData.dimensions);
        
        const newItem: AIGeneratedItem = {
          id: this.nextItemId++,
          name: webSearchData.name,
          weight: webSearchData.weight,
          height: dimensions.height,
          width: dimensions.width,
          depth: dimensions.depth,
          volume: dimensions.volume,
          rank: 1000,
          type: "ai-generated",
          confidence: webSearchData.confidence,
          source: webSearchData.source,
          originalText: itemText,
          specifications: webSearchData.specifications,
          description: webSearchData.description
        };
        
        return newItem;
      }
      
      return null;
    } catch (error) {
      console.error('AI item generation failed:', error);
      return null;
    } finally {
      this.pendingItems.delete(itemText.toLowerCase());
    }
  }
}

export const aiInventoryService = new AIInventoryService();