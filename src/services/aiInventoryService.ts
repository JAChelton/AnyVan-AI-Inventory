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
    console.log(`🔍 Starting comprehensive web lookup for: ${itemText}`);
    
    try {
      // Method 1: Try backend scraping service first
      const backendResult = await this.tryBackendScraping(itemText);
      if (backendResult) {
        console.log('✅ Backend scraping successful');
        return backendResult;
      }
      
      // Method 2: Enhanced realistic database with better coverage
      const dbResult = await this.getEnhancedRealisticData(itemText);
      if (dbResult) {
        console.log('✅ Enhanced database match found');
        return dbResult;
      }
      
      // Method 3: Wikipedia API search
      const wikiResult = await this.searchWikipediaAPI(itemText);
      if (wikiResult) {
        console.log('✅ Wikipedia API successful');
        return wikiResult;
      }
      
      // Method 4: Smart estimation with improved logic
      console.log('📊 Using smart estimation');
      return this.getSmartEstimate(itemText);
      
    } catch (error) {
      console.error('Web lookup failed:', error);
      return this.getSmartEstimate(itemText);
    }
  }

  private async tryBackendScraping(itemText: string): Promise<WebLookupResult | null> {
    try {
      const response = await fetch('http://localhost:3001/api/scrape-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemText }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      
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
      console.log('Backend scraping failed:', error.message);
      return null;
    }
  }

  private async getEnhancedRealisticData(itemText: string): Promise<WebLookupResult | null> {
    const cleanedText = itemText.toLowerCase()
      .replace(/^\d+\s+/, '') // Remove leading numbers
      .replace(/\b(weber|gas|electric|manual|automatic|large|small|medium|mini)\s+/g, '') // Remove modifiers
      .trim();

    // Massive enhanced database with better coverage
    const enhancedDatabase = {
      // Freezers & Refrigeration
      'freezer': { weight: 65, dimensions: '140×70×85cm', category: 'appliances', confidence: 0.85, desc: 'Standard chest freezer' },
      'chest freezer': { weight: 65, dimensions: '140×70×85cm', category: 'appliances', confidence: 0.88, desc: 'Large chest freezer for home use' },
      'double freezer': { weight: 90, dimensions: '160×80×90cm', category: 'appliances', confidence: 0.85, desc: 'Double-door chest freezer' },
      'upright freezer': { weight: 55, dimensions: '60×65×180cm', category: 'appliances', confidence: 0.85, desc: 'Vertical freezer unit' },
      'deep freezer': { weight: 70, dimensions: '150×75×85cm', category: 'appliances', confidence: 0.85, desc: 'Deep chest freezer' },
      
      // BBQ & Outdoor Cooking
      'bbq': { weight: 45, dimensions: '120×60×90cm', category: 'outdoor', confidence: 0.85, desc: 'Gas barbecue grill' },
      'barbecue': { weight: 50, dimensions: '130×65×95cm', category: 'outdoor', confidence: 0.85, desc: 'Outdoor barbecue unit' },
      'grill': { weight: 40, dimensions: '110×55×85cm', category: 'outdoor', confidence: 0.80, desc: 'Outdoor cooking grill' },
      'gas grill': { weight: 45, dimensions: '120×60×90cm', category: 'outdoor', confidence: 0.85, desc: 'Gas-powered barbecue grill' },
      'charcoal grill': { weight: 35, dimensions: '100×55×80cm', category: 'outdoor', confidence: 0.85, desc: 'Charcoal barbecue grill' },
      
      // Exercise Equipment
      'exercise bike': { weight: 45, dimensions: '110×50×140cm', category: 'fitness', confidence: 0.88, desc: 'Stationary exercise bicycle' },
      'stationary bike': { weight: 42, dimensions: '105×48×135cm', category: 'fitness', confidence: 0.88, desc: 'Indoor cycling machine' },
      'bike': { weight: 20, dimensions: '95×30×140cm', category: 'fitness', confidence: 0.75, desc: 'Standard bicycle' },
      'treadmill': { weight: 85, dimensions: '180×80×140cm', category: 'fitness', confidence: 0.90, desc: 'Electric treadmill for running' },
      'elliptical': { weight: 70, dimensions: '170×70×160cm', category: 'fitness', confidence: 0.88, desc: 'Elliptical training machine' },
      'rowing machine': { weight: 35, dimensions: '220×50×55cm', category: 'fitness', confidence: 0.85, desc: 'Indoor rowing equipment' },
      'weight bench': { weight: 25, dimensions: '120×35×45cm', category: 'fitness', confidence: 0.85, desc: 'Weight lifting bench' },
      
      // Musical Instruments
      'piano': { weight: 180, dimensions: '150×60×110cm', category: 'musical', confidence: 0.95, desc: 'Acoustic upright piano' },
      'upright piano': { weight: 200, dimensions: '155×65×115cm', category: 'musical', confidence: 0.95, desc: 'Traditional upright piano' },
      'grand piano': { weight: 400, dimensions: '200×150×100cm', category: 'musical', confidence: 0.95, desc: 'Concert grand piano' },
      'keyboard': { weight: 15, dimensions: '130×35×15cm', category: 'musical', confidence: 0.85, desc: 'Electric keyboard piano' },
      'drum kit': { weight: 35, dimensions: '150×120×120cm', category: 'musical', confidence: 0.85, desc: 'Complete drum set' },
      'guitar': { weight: 3, dimensions: '100×35×10cm', category: 'musical', confidence: 0.90, desc: 'Acoustic or electric guitar' },
      
      // Large Furniture & Recreation
      'pool table': { weight: 320, dimensions: '280×150×80cm', category: 'recreation', confidence: 0.92, desc: 'Full-size billiard table' },
      'billiard table': { weight: 350, dimensions: '290×160×82cm', category: 'recreation', confidence: 0.92, desc: 'Professional billiard table' },
      'ping pong table': { weight: 45, dimensions: '275×152×76cm', category: 'recreation', confidence: 0.88, desc: 'Table tennis table' },
      'table tennis table': { weight: 45, dimensions: '275×152×76cm', category: 'recreation', confidence: 0.88, desc: 'Ping pong table' },
      'foosball table': { weight: 65, dimensions: '140×75×90cm', category: 'recreation', confidence: 0.85, desc: 'Table football game' },
      
      // Hot Tubs & Spas
      'hot tub': { weight: 450, dimensions: '220×220×90cm', category: 'outdoor', confidence: 0.88, desc: 'Residential hot tub spa' },
      'jacuzzi': { weight: 500, dimensions: '240×240×95cm', category: 'outdoor', confidence: 0.88, desc: 'Luxury spa jacuzzi' },
      'spa': { weight: 480, dimensions: '230×230×92cm', category: 'outdoor', confidence: 0.85, desc: 'Outdoor spa unit' },
      'sauna': { weight: 200, dimensions: '200×150×200cm', category: 'outdoor', confidence: 0.80, desc: 'Home sauna unit' },
      
      // Appliances
      'wine fridge': { weight: 55, dimensions: '60×60×140cm', category: 'appliances', confidence: 0.85, desc: 'Wine cooling refrigerator' },
      'beer fridge': { weight: 45, dimensions: '50×55×85cm', category: 'appliances', confidence: 0.85, desc: 'Beverage refrigerator' },
      'mini fridge': { weight: 25, dimensions: '44×47×46cm', category: 'appliances', confidence: 0.85, desc: 'Compact refrigerator' },
      
      // Aquarium & Pets
      'aquarium': { weight: 40, dimensions: '120×45×55cm', category: 'aquarium', confidence: 0.85, desc: 'Large fish tank' },
      'fish tank': { weight: 35, dimensions: '100×40×50cm', category: 'aquarium', confidence: 0.85, desc: 'Home aquarium system' },
      'terrarium': { weight: 25, dimensions: '80×40×60cm', category: 'aquarium', confidence: 0.80, desc: 'Reptile habitat enclosure' },
      
      // Tools & Workshop
      'tool chest': { weight: 35, dimensions: '70×35×40cm', category: 'tools', confidence: 0.85, desc: 'Professional tool storage' },
      'toolbox': { weight: 15, dimensions: '50×25×30cm', category: 'tools', confidence: 0.85, desc: 'Portable tool container' },
      'workbench': { weight: 80, dimensions: '150×60×85cm', category: 'tools', confidence: 0.85, desc: 'Workshop work table' },
      'air compressor': { weight: 45, dimensions: '60×40×70cm', category: 'tools', confidence: 0.85, desc: 'Pneumatic air compressor' },
      'generator': { weight: 55, dimensions: '70×50×55cm', category: 'tools', confidence: 0.85, desc: 'Portable power generator' },
      
      // Garden & Outdoor
      'garden shed': { weight: 150, dimensions: '240×180×200cm', category: 'outdoor', confidence: 0.82, desc: 'Outdoor storage shed' },
      'shed': { weight: 120, dimensions: '200×150×180cm', category: 'outdoor', confidence: 0.80, desc: 'Garden storage building' },
      'greenhouse': { weight: 85, dimensions: '300×200×200cm', category: 'outdoor', confidence: 0.80, desc: 'Garden greenhouse structure' },
      'gazebo': { weight: 120, dimensions: '300×300×250cm', category: 'outdoor', confidence: 0.75, desc: 'Outdoor pavilion structure' },
      'trampoline': { weight: 75, dimensions: '400×400×90cm', category: 'outdoor', confidence: 0.85, desc: 'Large outdoor trampoline' },
      
      // Security & Storage
      'safe': { weight: 120, dimensions: '60×45×35cm', category: 'security', confidence: 0.90, desc: 'Home security safe' },
      'gun safe': { weight: 200, dimensions: '80×50×40cm', category: 'security', confidence: 0.90, desc: 'Firearm security cabinet' },
      'filing cabinet': { weight: 40, dimensions: '40×60×130cm', category: 'storage', confidence: 0.88, desc: 'Office document storage' },
      
      // Gaming & Entertainment
      'arcade machine': { weight: 135, dimensions: '70×85×180cm', category: 'recreation', confidence: 0.88, desc: 'Vintage arcade game cabinet' },
      'pinball machine': { weight: 125, dimensions: '140×75×180cm', category: 'recreation', confidence: 0.90, desc: 'Classic pinball game' },
      'jukebox': { weight: 95, dimensions: '80×65×160cm', category: 'recreation', confidence: 0.85, desc: 'Vintage music jukebox' }
    };

    // Check exact match first
    if (enhancedDatabase[cleanedText]) {
      const item = enhancedDatabase[cleanedText];
      console.log(`✅ Exact database match: ${cleanedText}`);
      return {
        name: this.capitalizeWords(itemText),
        weight: item.weight,
        dimensions: item.dimensions,
        category: item.category,
        confidence: item.confidence,
        source: 'Product Database',
        description: item.desc
      };
    }

    // Check partial matches with better scoring
    const partialMatches = [];
    for (const [key, value] of Object.entries(enhancedDatabase)) {
      const keyWords = key.split(' ');
      const cleanedWords = cleanedText.split(' ');
      
      // Calculate match score
      let matchScore = 0;
      let totalWords = Math.max(keyWords.length, cleanedWords.length);
      
      keyWords.forEach(keyWord => {
        if (cleanedWords.some(cleanedWord => 
          cleanedWord.includes(keyWord) || keyWord.includes(cleanedWord)
        )) {
          matchScore++;
        }
      });
      
      const matchRatio = matchScore / totalWords;
      
      if (matchRatio >= 0.5) { // At least 50% word match
        partialMatches.push({
          key,
          value,
          score: matchRatio,
          wordMatches: matchScore
        });
      }
    }
    
    // Sort by match quality (score, then word matches)
    partialMatches.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return b.wordMatches - a.wordMatches;
    });
    
    if (partialMatches.length > 0) {
      const bestMatch = partialMatches[0];
      console.log(`✅ Partial database match: ${bestMatch.key} (score: ${bestMatch.score})`);
      
      return {
        name: this.capitalizeWords(itemText),
        weight: bestMatch.value.weight,
        dimensions: bestMatch.value.dimensions,
        category: bestMatch.value.category,
        confidence: bestMatch.value.confidence - 0.05, // Slightly lower confidence for partial matches
        source: 'Product Database',
        description: bestMatch.value.desc
      };
    }

    return null;
  }

  private async searchWikipediaAPI(itemText: string): Promise<WebLookupResult | null> {
    try {
      console.log(`📚 Searching Wikipedia for: ${itemText}`);
      
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(itemText)}&limit=3&namespace=0&format=json&origin=*`;
      const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
      const searchData = await searchResponse.json();
      
      if (searchData[1] && searchData[1].length > 0) {
        const title = searchData[1][0];
        
        const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;
        const contentResponse = await fetch(contentUrl, { signal: AbortSignal.timeout(5000) });
        const contentData = await contentResponse.json();
        
        const pages = contentData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId]?.extract;
        
        if (extract && extract.length > 50) {
          const weight = this.extractWeightFromText(extract.toLowerCase());
          const dimensions = this.extractDimensionsFromText(extract.toLowerCase());
          const category = this.categorizeFromText(extract.toLowerCase(), itemText);
          
          return {
            name: this.capitalizeWords(itemText),
            weight: weight || this.estimateRealisticWeight(itemText),
            dimensions: dimensions,
            category: category,
            confidence: weight ? 0.88 : 0.72,
            source: 'Wikipedia',
            description: extract.substring(0, 120) + '...'
          };
        }
      }
    } catch (error) {
      console.log('Wikipedia search failed:', error.message);
    }
    return null;
  }

  private getSmartEstimate(itemText: string): WebLookupResult {
    return {
      name: this.capitalizeWords(itemText),
      weight: this.estimateRealisticWeight(itemText),
      dimensions: this.estimateRealisticDimensions(itemText),
      category: this.categorizeFromText('', itemText),
      confidence: 0.65,
      source: 'Smart Estimation',
      description: `Estimated specifications for ${itemText} based on item type analysis`
    };
  }

  private estimateRealisticDimensions(itemText: string): string {
    const lowerText = itemText.toLowerCase();
    
    // Specific dimension estimates
    if (lowerText.includes('freezer')) return '140×70×85cm';
    if (lowerText.includes('piano')) return '150×60×110cm';
    if (lowerText.includes('treadmill')) return '180×80×140cm';
    if (lowerText.includes('pool table')) return '280×150×80cm';
    if (lowerText.includes('hot tub')) return '220×220×90cm';
    if (lowerText.includes('safe')) return '60×45×35cm';
    if (lowerText.includes('bbq') || lowerText.includes('grill')) return '120×60×90cm';
    if (lowerText.includes('exercise bike') || lowerText.includes('bike')) return '110×50×140cm';
    
    // Size-based estimates
    if (lowerText.includes('large')) return '120×80×100cm';
    if (lowerText.includes('small') || lowerText.includes('mini')) return '40×30×25cm';
    if (lowerText.includes('table')) return '140×80×75cm';
    if (lowerText.includes('chair')) return '60×50×90cm';
    if (lowerText.includes('bed')) return '200×140×50cm';
    if (lowerText.includes('sofa')) return '180×90×85cm';
    if (lowerText.includes('cabinet') || lowerText.includes('wardrobe')) return '120×60×180cm';
    if (lowerText.includes('machine')) return '80×60×120cm';
    
    return '80×60×80cm'; // Default reasonable size
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
      'musical': ['music', 'instrument', 'piano', 'guitar', 'drum', 'keyboard'],
      'fitness': ['exercise', 'fitness', 'gym', 'workout', 'training', 'bike', 'treadmill'],
      'furniture': ['furniture', 'table', 'chair', 'sofa', 'bed', 'cabinet', 'wardrobe'],
      'appliances': ['appliance', 'machine', 'electronic', 'kitchen', 'freezer', 'fridge'],
      'outdoor': ['garden', 'outdoor', 'patio', 'yard', 'shed', 'bbq', 'grill', 'hot tub'],
      'tools': ['tool', 'equipment', 'workshop', 'construction', 'generator'],
      'recreation': ['pool table', 'arcade', 'pinball', 'game', 'entertainment'],
      'security': ['safe', 'security', 'gun safe']
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
    
    // Specific weight estimates based on item type
    if (lowerText.includes('piano')) return 180;
    if (lowerText.includes('treadmill')) return 85;
    if (lowerText.includes('safe')) return 120;
    if (lowerText.includes('pool table')) return 300;
    if (lowerText.includes('hot tub') || lowerText.includes('jacuzzi')) return 450;
    if (lowerText.includes('exercise bike')) return 45;
    if (lowerText.includes('freezer')) return 65;
    if (lowerText.includes('bbq') || lowerText.includes('grill')) return 45;
    if (lowerText.includes('shed')) return 150;
    if (lowerText.includes('generator')) return 55;
    if (lowerText.includes('arcade')) return 135;
    if (lowerText.includes('workbench')) return 80;
    
    // Category-based estimates
    if (lowerText.includes('machine')) baseWeight = 70;
    else if (lowerText.includes('table')) baseWeight = 40;
    else if (lowerText.includes('chair')) baseWeight = 15;
    else if (lowerText.includes('bed')) baseWeight = 50;
    else if (lowerText.includes('sofa')) baseWeight = 45;
    else if (lowerText.includes('cabinet')) baseWeight = 60;
    else if (lowerText.includes('appliance')) baseWeight = 50;
    
    // Size modifiers
    if (lowerText.includes('large') || lowerText.includes('big')) baseWeight *= 2;
    if (lowerText.includes('small') || lowerText.includes('mini')) baseWeight *= 0.5;
    if (lowerText.includes('heavy') || lowerText.includes('iron') || lowerText.includes('steel')) baseWeight *= 2.5;
    if (lowerText.includes('light') || lowerText.includes('plastic')) baseWeight *= 0.4;
    if (lowerText.includes('double') || lowerText.includes('twin')) baseWeight *= 1.5;
    
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
      console.log('⏳ Item already being processed:', itemText);
      return null;
    }
    
    this.pendingItems.add(itemText.toLowerCase());
    
    try {
      console.log(`🚀 Generating AI item for: "${itemText}"`);
      
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
        
        console.log('✅ AI item generated successfully:', newItem.name);
        return newItem;
      }
      
      console.log('❌ Failed to generate AI item for:', itemText);
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
