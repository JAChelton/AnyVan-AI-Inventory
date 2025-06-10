import React, { useState } from 'react';
import { Package, Copyright as Weight, Ruler, Hash } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ItemCard } from './components/ItemCard';
import { AddItemModal } from './components/AddItemModal';
import { EditItemModal } from './components/EditItemModal';
import { InventoryList } from './components/InventoryList';
import { StatsCard } from './components/StatsCard';
import { AIItemSearch } from './components/AIItemSearch';
import { AIItemCard } from './components/AIItemCard';
import { useItemSearch } from './hooks/useItemSearch';
import { useInventory } from './hooks/useInventory';
import { useAIInventory } from './hooks/useAIInventory';
import { InventoryItem, InventoryRecord } from './types/inventory';
import { AIGeneratedItem } from './services/aiInventoryService';
import { inventoryItems } from './data/inventoryItems';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'inventory' | 'ai'>('search');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null);

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

  const {
    inventory,
    addItem,
    updateItem,
    removeItem,
    getTotalItems,
    getTotalVolume,
    getTotalWeight
  } = useInventory();

  const {
    aiItems,
    addAIItem,
    removeAIItem,
    convertToInventoryItem,
    getAllItems
  } = useAIInventory();

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)} m³`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)} L`;
    }
    return `${volume.toLocaleString()} cm³`;
  };

  const handleAIItemGenerated = (aiItem: AIGeneratedItem) => {
    addAIItem(aiItem);
  };

  const handleAddAIItemToInventory = (aiItem: AIGeneratedItem) => {
    const inventoryItem = convertToInventoryItem(aiItem);
    setSelectedItem(inventoryItem);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
  };

  // Show suggestion to use AI search when no results found in database
  const showAISuggestion = searchTerm.trim() && filteredItems.length === 0 && !hasGoodResults && suggestions.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Enhanced Inventory Manager</h1>
            </div>
            
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Database Search
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                AI Search ({aiItems.length})
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'inventory'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Inventory ({getTotalItems()})
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Search</h2>
              <p className="text-gray-600">Search our comprehensive database of {inventoryItems.length} pre-loaded items with accurate specifications.</p>
            </div>

            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onFilterClick={() => setIsFilterOpen(true)}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {filteredItems.length} items from database
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            {/* Show "Did you mean?" suggestions only when there are relevant suggestions */}
            {suggestions.length > 0 && filteredItems.length === 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">Did you mean?</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onAddToInventory={setSelectedItem}
                />
              ))}
            </div>

            {showAISuggestion && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found in database</h3>
                <p className="text-gray-500 mb-4">
                  "{searchTerm}" wasn't found in our pre-loaded database of {inventoryItems.length} items.
                </p>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try AI Search Instead
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  AI Search can find any item using web scraping and intelligent estimation
                </p>
              </div>
            )}

            {filteredItems.length === 0 && !showAISuggestion && suggestions.length === 0 && (searchTerm || hasActiveFilters) && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search terms or filters.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'ai' ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Enhanced Item Search</h2>
              <p className="text-gray-600">Describe any item and let AI find accurate specifications from multiple sources.</p>
            </div>

            <AIItemSearch onItemGenerated={handleAIItemGenerated} />

            {aiItems.length > 0 && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Items ({aiItems.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {aiItems.map((item) => (
                      <AIItemCard
                        key={item.id}
                        item={item}
                        onAddToInventory={handleAddAIItemToInventory}
                        onRemove={removeAIItem}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {aiItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI items generated yet</h3>
                <p className="text-gray-500">Use the search above to generate items with AI-powered web scraping.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Inventory</h2>
              <p className="text-gray-600">Manage your current inventory items and track their details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Items"
                value={getTotalItems().toString()}
                icon={Hash}
                color="bg-blue-500"
              />
              <StatsCard
                title="Total Weight"
                value={`${getTotalWeight().toLocaleString()} kg`}
                icon={Weight}
                color="bg-green-500"
              />
              <StatsCard
                title="Total Volume"
                value={formatVolume(getTotalVolume())}
                icon={Ruler}
                color="bg-purple-500"
              />
              <StatsCard
                title="Unique Items"
                value={inventory.length.toString()}
                icon={Package}
                color="bg-orange-500"
              />
            </div>

            <InventoryList
              inventory={inventory}
              onEdit={setEditingRecord}
              onDelete={removeItem}
            />
          </div>
        )}
      </main>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={updateFilters}
      />

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