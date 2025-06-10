export interface InventoryItem {
  id: number;
  name: string;
  weight: number;
  height: number;
  depth: number;
  width: number;
  volume: number;
  rank: number;
}

export interface InventoryRecord {
  id: string;
  item: InventoryItem;
  quantity: number;
  location: string;
  dateAdded: string;
  notes?: string;
}

export interface SearchFilters {
  category?: string;
  minWeight?: number;
  maxWeight?: number;
  minVolume?: number;
  maxVolume?: number;
  location?: string;
}