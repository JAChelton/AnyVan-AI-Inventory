// src/components/navigation/TabNavigation.tsx
import React from 'react';
import { Search, Package, Brain } from 'lucide-react';

type TabType = 'search' | 'inventory' | 'ai';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'search' as const, label: 'Search Items', icon: Search },
    { id: 'inventory' as const, label: 'Inventory', icon: Package },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center px-4 py-2 rounded-md font-medium transition-colors
              ${isActive
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// src/components/content/SearchTabContent.tsx
import React from 'react';
import { SearchBar } from '../SearchBar';
import { FilterPanel } from '../FilterPanel';
import { ItemCard } from '../ItemCard';
import { StatsCard } from '../StatsCard';
import { Package, Weight, Ruler, Hash } from 'lucide-react';
import { useItemSearch } from '../../hooks/useItemSearch';
import { InventoryItem } from '../../types/inventory';

interface SearchTabContentProps {
  onItemSelect: (item: InventoryItem) => void;
}

export const SearchTabContent: React.FC<SearchTabContentProps> = ({ onItemSelect }) => {
  const {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    filteredItems,
    suggestions,
    hasGoodResults
  } = useItemSearch();

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)} m³`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)} L`;
    }
    return `${volume.toLocaleString()} cm³`;
  };

  const totalStats = filteredItems.reduce(
    (acc, item) => ({
      items: acc.items + 1,
      weight: acc.weight + item.WEIGHT,
      volume: acc.volume + item.VOLUME,
    }),
    { items: 0, weight: 0, volume: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={totalStats.items.toLocaleString()}
          icon={Package}
          color="bg-blue-500"
        />
        <StatsCard
          title="Total Weight"
          value={`${totalStats.weight.toLocaleString()} kg`}
          icon={Weight}
          color="bg-green-500"
        />
        <StatsCard
          title="Total Volume"
          value={formatVolume(totalStats.volume)}
          icon={Ruler}
          color="bg-purple-500"
        />
        <StatsCard
          title="Unique Items"
          value={new Set(filteredItems.map(item => item.name)).size.toLocaleString()}
          icon={Hash}
          color="bg-orange-500"
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            suggestions={suggestions}
            placeholder="Search inventory items..."
          />
        </div>
        <FilterPanel
          filters={filters}
          onFilterChange={updateFilters}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results
            </h2>
            <span className="text-sm text-gray-500">
              {filteredItems.length} items found
            </span>
          </div>
        </div>
        
        <div className="p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No items found matching your search.' : 'Start typing to search items...'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={onItemSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// src/components/content/InventoryTabContent.tsx
import React from 'react';
import { InventoryList } from '../InventoryList';
import { AddItemModal } from '../AddItemModal';
import { EditItemModal } from '../EditItemModal';
import { useInventory } from '../../hooks/useInventory';
import { InventoryItem, InventoryRecord } from '../../types/inventory';

interface InventoryTabContentProps {
  editingRecord: InventoryRecord | null;
  onEditRecord: (record: InventoryRecord | null) => void;
}

export const InventoryTabContent: React.FC<InventoryTabContentProps> = ({
  editingRecord,
  onEditRecord
}) => {
  const {
    inventory,
    addItem,
    updateItem,
    removeItem,
    getTotalItems,
    getTotalVolume,
    getTotalWeight
  } = useInventory();

  const [showAddModal, setShowAddModal] = React.useState(false);

  return (
    <div className="space-y-6">
      <InventoryList
        inventory={inventory}
        onEdit={onEditRecord}
        onDelete={removeItem}
        onAddNew={() => setShowAddModal(true)}
      />

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addItem}
      />

      <EditItemModal
        isOpen={!!editingRecord}
        onClose={() => onEditRecord(null)}
        onSave={updateItem}
        record={editingRecord}
      />
    </div>
  );
};

// src/components/content/AITabContent.tsx
import React from 'react';
import { AIItemSearch } from '../AIItemSearch';
import { AIItemCard } from '../AIItemCard';
import { useAIInventory } from '../../hooks/useAIInventory';
import { AIGeneratedItem } from '../../services/aiInventoryService';

interface AITabContentProps {
  onAIItemGenerated: (item: AIGeneratedItem) => void;
  onAddAIItemToInventory: (item: AIGeneratedItem) => void;
}

export const AITabContent: React.FC<AITabContentProps> = ({
  onAIItemGenerated,
  onAddAIItemToInventory
}) => {
  const { aiItems, removeAIItem } = useAIInventory();

  return (
    <div className="space-y-6">
      <AIItemSearch onItemGenerated={onAIItemGenerated} />
      
      {aiItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Generated Items
            </h2>
            <p className="text-sm text-gray-500">
              {aiItems.length} items generated
            </p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiItems.map((item) => (
                <AIItemCard
                  key={item.id}
                  item={item}
                  onAddToInventory={() => onAddAIItemToInventory(item)}
                  onRemove={() => removeAIItem(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};