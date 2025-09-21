// Master data management component

import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download, Edit, Trash2, Search, Filter } from 'lucide-react';
import { MasterDataItem, dbManager } from '../utils/database';

interface MasterDataManagerProps {
  projectId: string;
  onDataUpdated: () => void;
}

const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  projectId,
  onDataUpdated
}) => {
  const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'screen' | 'cpu'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [newItem, setNewItem] = useState({
    item_description: '',
    serial_number: '',
    tag_number: '',
    quantity: 1,
    status: 'New'
  });

  // Load master data
  const loadMasterData = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const data = await dbManager.getMasterData(projectId);
      setMasterData(data);
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, [projectId]);

  // Add new item
  const handleAddItem = async () => {
    if (!newItem.item_description || !newItem.serial_number || !newItem.tag_number) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await dbManager.addMasterData(projectId, [newItem]);
      setNewItem({
        item_description: '',
        serial_number: '',
        tag_number: '',
        quantity: 1,
        status: 'New'
      });
      setShowAddForm(false);
      loadMasterData();
      onDataUpdated();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  // Update item
  const handleUpdateItem = async (itemId: string, updates: Partial<MasterDataItem>) => {
    try {
      await dbManager.updateMasterData(projectId, itemId, updates);
      loadMasterData();
      onDataUpdated();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await dbManager.deleteMasterData(projectId, itemId);
      loadMasterData();
      onDataUpdated();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const blob = await dbManager.exportToExcel(projectId, 'screen_cpu');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master_data_${projectId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel');
    }
  };

  // Filter data
  const filteredData = masterData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tag_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      item.item_description.toLowerCase() === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Master Data Management</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'screen' | 'cpu')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Items</option>
          <option value="screen">Screen</option>
          <option value="cpu">CPU</option>
        </select>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-gray-800 mb-3">Add New Item</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
              <input
                type="text"
                value={newItem.item_description}
                onChange={(e) => setNewItem({ ...newItem, item_description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Screen, CPU"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={newItem.serial_number}
                onChange={(e) => setNewItem({ ...newItem, serial_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1H35070V93"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag Number</label>
              <input
                type="text"
                value={newItem.tag_number}
                onChange={(e) => setNewItem({ ...newItem, tag_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., MOH/DIG/25/SCR587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Item</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Serial Number</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Tag Number</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                  No items found
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.item_description}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{item.serial_number}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{item.tag_number}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.quantity}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.status}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredData.length} of {masterData.length} items
      </div>
    </div>
  );
};

export default MasterDataManager;
