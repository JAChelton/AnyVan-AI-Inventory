// src/constants/inventory.ts
export const INVENTORY_CONSTANTS = {
  TIMEOUTS: {
    WEB_SEARCH: 10000,
    API_CALL: 5000,
    WIKIPEDIA_SEARCH: 8000,
  },
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5,
    FALLBACK: 0.65,
  },
  VOLUME_UNITS: {
    CUBIC_METER: 1000000000,
    LITER: 1000000,
  },
  WEIGHT_LIMITS: {
    MAX_REASONABLE: 10000, // kg
    MIN_REASONABLE: 0.1,   // kg
  },
  DEFAULT_DIMENSIONS: {
    SMALL: '40×30×25cm',
    MEDIUM: '80×60×80cm',
    LARGE: '120×80×100cm',
    EXTRA_LARGE: '150×100×120cm',
  },
  DIMENSION_ESTIMATES: {
    // Furniture
    TABLE: { height: 75, width: 140, depth: 80 },
    CHAIR: { height: 90, width: 60, depth: 50 },
    BED: { height: 50, width: 200, depth: 140 },
    SOFA: { height: 85, width: 180, depth: 90 },
    CABINET: { height: 180, width: 120, depth: 60 },
    WARDROBE: { height: 200, width: 120, depth: 60 },
    
    // Appliances
    FRIDGE: { height: 180, width: 60, depth: 65 },
    FREEZER: { height: 140, width: 70, depth: 85 },
    WASHING_MACHINE: { height: 85, width: 60, depth: 60 },
    DISHWASHER: { height: 82, width: 60, depth: 55 },
    
    // Electronics
    TV_SMALL: { height: 49, width: 76, depth: 17 },
    TV_MEDIUM: { height: 70, width: 109, depth: 30 },
    TV_LARGE: { height: 90, width: 140, depth: 35 },
    
    // Exercise Equipment
    TREADMILL: { height: 140, width: 180, depth: 80 },
    EXERCISE_BIKE: { height: 140, width: 110, depth: 50 },
    
    // Default fallbacks
    DEFAULT: { height: 80, width: 80, depth: 60 },
    SMALL_ITEM: { height: 25, width: 40, depth: 30 },
    LARGE_ITEM: { height: 120, width: 120, depth: 100 },
  },
  WEIGHT_ESTIMATES: {
    // Base weights by category (kg)
    FURNITURE_LIGHT: 15,
    FURNITURE_MEDIUM: 35,
    FURNITURE_HEAVY: 75,
    APPLIANCE_SMALL: 25,
    APPLIANCE_LARGE: 80,
    ELECTRONICS_SMALL: 5,
    ELECTRONICS_LARGE: 30,
    EXERCISE_EQUIPMENT: 50,
    DEFAULT: 20,
  },
  API_ENDPOINTS: {
    WIKIPEDIA: 'https://en.wikipedia.org/api/rest_v1/page/summary',
    BACKEND_SCRAPER: 'http://localhost:3001/api/scrape-item',
  },
  CACHE: {
    MAX_ENTRIES: 1000,
    TTL_MS: 1000 * 60 * 30, // 30 minutes
  },
} as const;

export const ITEM_CATEGORIES = {
  FURNITURE: 'furniture',
  APPLIANCES: 'appliances',
  ELECTRONICS: 'electronics',
  EXERCISE: 'exercise',
  AUTOMOTIVE: 'automotive',
  TOOLS: 'tools',
  MISC: 'misc',
} as const;

export const DIMENSION_KEYWORDS = {
  LARGE: ['large', 'big', 'huge', 'massive', 'giant'],
  SMALL: ['small', 'mini', 'compact', 'tiny', 'little'],
  FURNITURE: ['table', 'chair', 'bed', 'sofa', 'cabinet', 'wardrobe', 'desk'],
  APPLIANCES: ['fridge', 'freezer', 'washer', 'dryer', 'dishwasher', 'oven'],
  ELECTRONICS: ['tv', 'television', 'monitor', 'computer', 'laptop'],
  EXERCISE: ['treadmill', 'bike', 'bench', 'weights', 'dumbbell'],
} as const;