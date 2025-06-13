// src/types/enhanced.ts
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

export interface DimensionEstimate {
  height: number;
  width: number;
  depth: number;
  confidence: number;
}

export interface WeightEstimate {
  value: number;
  unit: 'kg' | 'lbs';
  confidence: number;
}

export interface APIResponse<T = unknown> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: number;
}

export interface WikipediaResponse {
  type: string;
  title: string;
  displaytitle: string;
  extract: string;
  extract_html: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

export interface BackendScrapingResult {
  name: string;
  weight: number;
  dimensions?: string;
  category?: string;
  confidence?: number;
  source?: string;
  description?: string;
  specifications?: Record<string, unknown>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface EstimationContext {
  itemText: string;
  category: string;
  keywords: string[];
  sizeModifiers: string[];
}

export interface LookupStrategy {
  name: string;
  priority: number;
  execute: (itemText: string) => Promise<WebLookupResult | null>;
  timeout: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ItemSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ItemCategory = 'furniture' | 'appliances' | 'electronics' | 'exercise' | 'automotive' | 'tools' | 'misc';