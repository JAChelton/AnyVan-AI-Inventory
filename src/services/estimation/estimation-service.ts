// src/services/estimation/EstimationService.ts
import { INVENTORY_CONSTANTS, DIMENSION_KEYWORDS } from '../../constants/inventory';
import { DimensionEstimate, WeightEstimate, EstimationContext, ItemCategory, ItemSize } from '../../types/enhanced';

export class EstimationService {
  
  estimateWeight(context: EstimationContext): WeightEstimate {
    const { itemText, category, keywords } = context;
    const lowerText = itemText.toLowerCase();
    
    // Extract weight from text if present
    const extractedWeight = this.extractWeightFromText(lowerText);
    if (extractedWeight) {
      return {
        value: extractedWeight,
        unit: 'kg',
        confidence: 0.95
      };
    }

    // Category-based estimation
    let baseWeight = this.getBaseWeightByCategory(category);
    
    // Apply size modifiers
    const sizeMultiplier = this.getSizeMultiplier(keywords);
    baseWeight *= sizeMultiplier;
    
    // Apply material modifiers
    const materialMultiplier = this.getMaterialMultiplier(lowerText);
    baseWeight *= materialMultiplier;
    
    // Apply item-specific adjustments
    baseWeight = this.applySpecificAdjustments(lowerText, baseWeight);
    
    // Ensure reasonable bounds
    const clampedWeight = Math.max(
      INVENTORY_CONSTANTS.WEIGHT_LIMITS.MIN_REASONABLE,
      Math.min(baseWeight, INVENTORY_CONSTANTS.WEIGHT_LIMITS.MAX_REASONABLE)
    );

    return {
      value: Math.round(clampedWeight * 100) / 100, // Round to 2 decimal places
      unit: 'kg',
      confidence: 0.7
    };
  }

  estimateDimensions(context: EstimationContext): DimensionEstimate {
    const { itemText, category, keywords } = context;
    const lowerText = itemText.toLowerCase();
    
    // Extract dimensions from text if present
    const extractedDimensions = this.extractDimensionsFromText(lowerText);
    if (extractedDimensions) {
      return { ...extractedDimensions, confidence: 0.95 };
    }

    // Use predefined estimates for common items
    const predefinedEstimate = this.getPredefinedDimensions(lowerText);
    if (predefinedEstimate) {
      return { ...predefinedEstimate, confidence: 0.85 };
    }

    // Category-based estimation
    let baseDimensions = this.getBaseDimensionsByCategory(category);
    
    // Apply size modifiers
    const sizeMultiplier = this.getSizeMultiplier(keywords);
    baseDimensions = {
      height: Math.round(baseDimensions.height * sizeMultiplier),
      width: Math.round(baseDimensions.width * sizeMultiplier),
      depth: Math.round(baseDimensions.depth * sizeMultiplier),
    };

    return {
      ...baseDimensions,
      confidence: 0.6
    };
  }

  categorizeItem(itemText: string): ItemCategory {
    const lowerText = itemText.toLowerCase();
    
    // Check for furniture keywords
    if (DIMENSION_KEYWORDS.FURNITURE.some(keyword => lowerText.includes(keyword))) {
      return 'furniture';
    }
    
    // Check for appliances
    if (DIMENSION_KEYWORDS.APPLIANCES.some(keyword => lowerText.includes(keyword))) {
      return 'appliances';
    }
    
    // Check for electronics
    if (DIMENSION_KEYWORDS.ELECTRONICS.some(keyword => lowerText.includes(keyword))) {
      return 'electronics';
    }
    
    // Check for exercise equipment
    if (DIMENSION_KEYWORDS.EXERCISE.some(keyword => lowerText.includes(keyword))) {
      return 'exercise';
    }
    
    // Check for automotive parts
    if (lowerText.includes('car') || lowerText.includes('auto') || lowerText.includes('vehicle')) {
      return 'automotive';
    }
    
    // Check for tools
    if (lowerText.includes('tool') || lowerText.includes('saw') || lowerText.includes('drill')) {
      return 'tools';
    }
    
    return 'misc';
  }

  extractKeywords(itemText: string): string[] {
    const lowerText = itemText.toLowerCase();
    const keywords: string[] = [];
    
    // Extract size keywords
    DIMENSION_KEYWORDS.LARGE.forEach(keyword => {
      if (lowerText.includes(keyword)) keywords.push(keyword);
    });
    
    DIMENSION_KEYWORDS.SMALL.forEach(keyword => {
      if (lowerText.includes(keyword)) keywords.push(keyword);
    });
    
    // Extract item type keywords
    Object.values(DIMENSION_KEYWORDS).flat().forEach(keyword => {
      if (lowerText.includes(keyword)) keywords.push(keyword);
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  private extractWeightFromText(text: string): number | null {
    const weightPatterns = [
      /(?:weighs?|weight|mass)[\s:]*(?:about|around|approximately|roughly)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)/gi,
      /(?:weighs?|weight|mass)[\s:]*(?:about|around|approximately|roughly)?\s*(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)/gi,
      /(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)(?:\s+(?:in\s+)?weight)?/gi,
      /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)(?:\s+(?:in\s+)?weight)?/gi,
    ];

    for (const pattern of weightPatterns) {
      const match = pattern.exec(text);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[0].toLowerCase();
        
        // Convert pounds to kg if necessary
        return unit.includes('lb') || unit.includes('pound') ? value * 0.453592 : value;
      }
    }

    return null;
  }

  private extractDimensionsFromText(text: string): Omit<DimensionEstimate, 'confidence'> | null {
    // Pattern for dimensions like "120x80x75cm" or "120 x 80 x 75 cm"
    const dimensionPattern = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:cm|centimeter|centimeters)?/gi;
    const match = dimensionPattern.exec(text);
    
    if (match) {
      return {
        height: parseFloat(match[3]), // Assuming height is the third dimension
        width: parseFloat(match[1]),
        depth: parseFloat(match[2]),
      };
    }

    return null;
  }

  private getPredefinedDimensions(text: string): Omit<DimensionEstimate, 'confidence'> | null {
    const estimates = INVENTORY_CONSTANTS.DIMENSION_ESTIMATES;
    
    // Check for specific items
    if (text.includes('table')) return estimates.TABLE;
    if (text.includes('chair')) return estimates.CHAIR;
    if (text.includes('bed')) return estimates.BED;
    if (text.includes('sofa')) return estimates.SOFA;
    if (text.includes('cabinet') || text.includes('wardrobe')) return estimates.CABINET;
    if (text.includes('fridge')) return estimates.FRIDGE;
    if (text.includes('freezer')) return estimates.FREEZER;
    if (text.includes('treadmill')) return estimates.TREADMILL;
    if (text.includes('exercise bike') || text.includes('bike')) return estimates.EXERCISE_BIKE;
    
    return null;
  }

  private getBaseWeightByCategory(category: string): number {
    const weights = INVENTORY_CONSTANTS.WEIGHT_ESTIMATES;
    
    switch (category) {
      case 'furniture': return weights.FURNITURE_MEDIUM;
      case 'appliances': return weights.APPLIANCE_LARGE;
      case 'electronics': return weights.ELECTRONICS_SMALL;
      case 'exercise': return weights.EXERCISE_EQUIPMENT;
      default: return weights.DEFAULT;
    }
  }

  private getBaseDimensionsByCategory(category: string): Omit<DimensionEstimate, 'confidence'> {
    const estimates = INVENTORY_CONSTANTS.DIMENSION_ESTIMATES;
    
    switch (category) {
      case 'furniture': return estimates.TABLE;
      case 'appliances': return estimates.FRIDGE;
      case 'electronics': return estimates.TV_MEDIUM;
      case 'exercise': return estimates.EXERCISE_BIKE;
      default: return estimates.DEFAULT;
    }
  }

  private getSizeMultiplier(keywords: string[]): number {
    const hasLarge = keywords.some(k => DIMENSION_KEYWORDS.LARGE.includes(k));
    const hasSmall = keywords.some(k => DIMENSION_KEYWORDS.SMALL.includes(k));
    
    if (hasLarge) return 1.5;
    if (hasSmall) return 0.6;
    return 1.0;
  }

  private getMaterialMultiplier(text: string): number {
    if (text.includes('metal') || text.includes('steel') || text.includes('iron')) return 1.8;
    if (text.includes('wood') || text.includes('wooden')) return 1.2;
    if (text.includes('plastic') || text.includes('lightweight')) return 0.7;
    if (text.includes('glass')) return 1.4;
    return 1.0;
  }

  private applySpecificAdjustments(text: string, weight: number): number {
    // Specific item adjustments
    if (text.includes('piano')) return Math.max(weight, 200);
    if (text.includes('safe')) return Math.max(weight, 100);
    if (text.includes('pool table')) return Math.max(weight, 300);
    if (text.includes('hot tub')) return Math.max(weight, 400);
    
    return weight;
  }
}