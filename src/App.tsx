import React, { useState } from 'react';
import { Package, Copyright as Weight, Ruler, Hash } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ItemCard } from './components/ItemCard';
import { AddItemModal } from './components/AddItemModal';
import { EditItemModal } from './components/EditItemModal';
import { InventoryList } from './components/InventoryList';
import { StatsCard } from './components/StatsCard';
import { useItemSearch } from './hooks/useItemSearch';
import { useInventory } from './hooks/useInventory';
import { InventoryItem, InventoryRecord } from './types/inventory';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'inventory'>('search');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    filteredItems
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

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)} m³`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)} L`;
    }
    return `${volume.toLocaleString()} cm³`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Inventory Manager</h1>
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
                Search Items
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Items</h2>
              <p className="text-gray-600">Find items from our comprehensive database to add to your inventory.</p>
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
                Showing {filteredItems.length} items
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onAddToInventory={setSelectedItem}
                />
              ))}
            </div>

            {filteredItems.length === 0 && (searchTerm || hasActiveFilters) && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search terms or filters.</p>
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