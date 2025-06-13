// src/App.tsx - REPLACE your existing App.tsx with this cleaned version

import React, { useState } from 'react';
import { Package, Weight, Ruler, Hash } from 'lucide-react';

// Import your existing components
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ItemCard } from './components/ItemCard';
import { AddItemModal } from './components/AddItemModal';
import { EditItemModal } from './components/EditItemModal';
import { InventoryList } from './components/InventoryList';
import { StatsCard } from './components/StatsCard';
import { AIItemSearch } from './components/AIItemSearch';
import { AIItemCard } from './components/AIItemCard';

// Import your existing hooks
import { useItemSearch } from './hooks/useItemSearch';
import { useInventory } from './hooks/useInventory';
import { useAIInventory } from './hooks/useAIInventory';

// Import your existing types
import { InventoryItem, InventoryRecord } from './types/inventory';
import { AIGeneratedItem } from './services/aiInventoryService';

type TabType = 'search' | 'inventory' | 'ai';

// Extracted components for better organization
const TabNavigation: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  itemCounts: { total: number; ai: number };
}> = ({ activeTab, onTabChange, itemCounts }) => (
  <nav className="flex space-x-1">
    <button
      onClick={() => onTabChange('search')}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === 'search'
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      Database Search
    </button>
    <button
      onClick={() => onTabChange('ai')}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === 'ai'
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      AI Search ({itemCounts.ai})
    </button>
    <button
      onClick={() => onTabChange('inventory')}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === 'inventory'
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      My Inventory ({itemCounts.total})
    </button>
  </nav>
);

const SearchTabContent: React.FC<{
  searchProps: ReturnType<typeof useItemSearch>;
  onItemSelect: (item: InventoryItem) => void;
  onSwitchToAI: () => void;
}> = ({ searchProps, onItemSelect, onSwitchToAI }) => {
  const { 
    searchTerm, 
    setSearchTerm, 
    filters, 
    updateFilters, 
    clearFilters, 
    filteredItems, 
    suggestions, 
    hasGoodResults 
  } = searchProps;

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);
  const showAISuggestion = searchTerm.trim() && filteredItems.length === 0 && !hasGoodResults && suggestions.length === 0;

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)} m³`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)} L`;
    return `${volume.toLocaleString()} cm³`;
  };

  // Calculate stats
  const stats = filteredItems.reduce(
    (acc, item) => ({
      items: acc.items + 1,
      weight: acc.weight + item.WEIGHT,
      volume: acc.volume + item.VOLUME,
    }),
    { items: 0, weight: 0, volume: 0 }
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Database</h2>
        <p className="text-gray-600">Search through {filteredItems.length} items in the database.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Items Found" value={stats.items.toString()} icon={Package} color="bg-blue-500" />
        <StatsCard title="Total Weight" value={`${stats.weight.toLocaleString()} kg`} icon={Weight} color="bg-green-500" />
        <StatsCard title="Total Volume" value={formatVolume(stats.volume)} icon={Ruler} color="bg-purple-500" />
        <StatsCard title="Unique Names" value={new Set(filteredItems.map(item => item.name)).size.toString()} icon={Hash} color="bg-orange-500" />
      </div>

      {/* Search Bar */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => {}} // Your existing filter logic
        onClear={() => {
          setSearchTerm('');
          clearFilters();
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {showAISuggestion ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No database matches found</h3>
            <p className="text-gray-500 mb-6">
              "{searchTerm}" isn't in our database, but AI Search can find it from the web.
            </p>
            <button
              onClick={onSwitchToAI}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try AI Search Instead
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No items found' : 'Start searching'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Enter a search term to find items.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onAddToInventory={onItemSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AITabContent: React.FC<{
  aiItems: AIGeneratedItem[];
  onItemGenerated: (item: AIGeneratedItem) => void;
  onAddToInventory: (item: AIGeneratedItem) => void;
  onRemoveItem: (id: number) => void;
}> = ({ aiItems, onItemGenerated, onAddToInventory, onRemoveItem }) => (
  <div>
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Enhanced Item Search</h2>
      <p className="text-gray-600">Describe any item and let AI find accurate specifications from multiple sources.</p>
    </div>

    <AIItemSearch onItemGenerated={onItemGenerated} />

    {aiItems.length > 0 ? (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Items ({aiItems.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {aiItems.map((item) => (
            <AIItemCard
              key={item.id}
              item={item}
              onAddToInventory={onAddToInventory}
              onRemove={onRemoveItem}
            />
          ))}
        </div>
      </div>
    ) : (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No AI items generated yet</h3>
        <p className="text-gray-500">Use the search above to generate items with AI-powered web scraping.</p>
      </div>
    )}
  </div>
);

const InventoryTabContent: React.FC<{
  inventory: InventoryRecord[];
  onEdit: (record: InventoryRecord) => void;
  onDelete: (id: number) => void;
  stats: { total: number; weight: number; volume: number };
  formatVolume: (volume: number) => string;
}> = ({ inventory, onEdit, onDelete, stats, formatVolume }) => (
  <div>
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">My Inventory</h2>
      <p className="text-gray-600">Manage your current inventory items and track their details.</p>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard title="Total Items" value={stats.total.toString()} icon={Hash} color="bg-blue-500" />
      <StatsCard title="Total Weight" value={`${stats.weight.toLocaleString()} kg`} icon={Weight} color="bg-green-500" />
      <StatsCard title="Total Volume" value={formatVolume(stats.volume)} icon={Ruler} color="bg-purple-500" />
      <StatsCard title="Unique Items" value={inventory.length.toString()} icon={Package} color="bg-orange-500" />
    </div>

    <InventoryList
      inventory={inventory}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  </div>
);

// Main App Component - much cleaner
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null);

  // Hooks
  const searchProps = useItemSearch();
  const { inventory, addItem, updateItem, removeItem, getTotalItems, getTotalVolume, getTotalWeight } = useInventory();
  const { aiItems, addAIItem, removeAIItem, convertToInventoryItem } = useAIInventory();

  // Utility function
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)} m³`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)} L`;
    return `${volume.toLocaleString()} cm³`;
  };

  // Event handlers
  const handleAIItemGenerated = (aiItem: AIGeneratedItem) => {
    addAIItem(aiItem);
  };

  const handleAddAIItemToInventory = (aiItem: AIGeneratedItem) => {
    const inventoryItem = convertToInventoryItem(aiItem);
    setSelectedItem(inventoryItem);
    removeAIItem(aiItem.id);
    setActiveTab('inventory');
  };

  const handleSwitchToAI = () => {
    setActiveTab('ai');
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <SearchTabContent
            searchProps={searchProps}
            onItemSelect={setSelectedItem}
            onSwitchToAI={handleSwitchToAI}
          />
        );
      case 'ai':
        return (
          <AITabContent
            aiItems={aiItems}
            onItemGenerated={handleAIItemGenerated}
            onAddToInventory={handleAddAIItemToInventory}
            onRemoveItem={removeAIItem}
          />
        );
      case 'inventory':
        return (
          <InventoryTabContent
            inventory={inventory}
            onEdit={setEditingRecord}
            onDelete={removeItem}
            stats={{
              total: getTotalItems(),
              weight: getTotalWeight(),
              volume: getTotalVolume(),
            }}
            formatVolume={formatVolume}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Enhanced Inventory Manager</h1>
            </div>
            
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              itemCounts={{ total: getTotalItems(), ai: aiItems.length }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Modals */}
      <AddItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAdd={addItem}
      />

      <EditItemModal
        record={editingRecord}
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onUpdate={updateItem}
      />
    </div>
  );
}

export default App;