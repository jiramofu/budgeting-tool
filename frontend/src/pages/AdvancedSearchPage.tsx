import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: string;
  categoryId: number;
}

interface SearchFilter {
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  categories?: number[];
  description?: string;
  merchants?: string[];
}

interface SavedSearch {
  id: number;
  name: string;
  description?: string;
  filters: SearchFilter;
  searchCount: number;
  lastUsedAt?: string;
  isFavorite: boolean;
}

const AdvancedSearchPage: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilter>({
    description: '',
    minAmount: undefined,
    maxAmount: undefined,
    startDate: '',
    endDate: '',
    categories: [],
  });

  const [results, setResults] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [hasMore, setHasMore] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchDescription, setNewSearchDescription] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    loadCategories();
    loadSavedSearches();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await apiClient.get('/search/saved');
      setSavedSearches(response.data.data?.searches || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const handleFilterChange = async (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Get suggestions when description changes
    if (key === 'description' && value) {
      try {
        const response = await apiClient.get('/search/suggestions', {
          params: { term: value, limit: 10 },
        });
        setSuggestions(response.data.data?.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    }
  };

  const performSearch = async (searchFilters: SearchFilter = filters, newOffset: number = 0) => {
    try {
      setLoading(true);
      setOffset(newOffset);

      const response = await apiClient.post('/search', {
        filters: searchFilters,
        limit,
        offset: newOffset,
      });

      setResults(response.data.data?.results || []);
      setTotal(response.data.data?.total || 0);
      setHasMore(response.data.data?.hasMore || false);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(filters, 0);
  };

  const handleSaveSearch = async () => {
    if (!newSearchName.trim()) {
      alert('Please enter a search name');
      return;
    }

    try {
      await apiClient.post('/search/saved', {
        name: newSearchName,
        filters,
        description: newSearchDescription,
      });

      setNewSearchName('');
      setNewSearchDescription('');
      setShowSaveDialog(false);
      loadSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
      alert('Failed to save search');
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    performSearch(search.filters, 0);
  };

  const toggleSearchFavorite = async (searchId: number) => {
    try {
      await apiClient.put(`/search/saved/${searchId}/favorite`);
      loadSavedSearches();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteSavedSearch = async (searchId: number) => {
    if (!window.confirm('Delete this saved search?')) return;

    try {
      await apiClient.delete(`/search/saved/${searchId}`);
      loadSavedSearches();
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      description: '',
      minAmount: undefined,
      maxAmount: undefined,
      startDate: '',
      endDate: '',
      categories: [],
    });
    setResults([]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Search</h1>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Saved Searches</h2>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-3 py-2 rounded-full"
              >
                <button
                  onClick={() => loadSavedSearch(search)}
                  className="font-medium hover:underline"
                >
                  {search.name}
                </button>
                <button
                  onClick={() => toggleSearchFavorite(search.id)}
                  className="text-lg"
                >
                  {search.isFavorite ? '⭐' : '☆'}
                </button>
                <button
                  onClick={() => deleteSavedSearch(search.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Description */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={filters.description || ''}
              onChange={(e) => handleFilterChange('description', e.target.value)}
              placeholder="Search by description..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-10">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleFilterChange('description', suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount Range
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Categories
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(cat.id) || false}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...(filters.categories || []), cat.id]
                      : (filters.categories || []).filter((id) => id !== cat.id);
                    handleFilterChange('categories', newCategories);
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Search
          </button>
          <button
            onClick={clearFilters}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Save Search</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search name..."
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <textarea
                placeholder="Description (optional)..."
                value={newSearchDescription}
                onChange={(e) => setNewSearchDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveSearch}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Results ({total} found)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                      {transaction.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white">
                      ${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <button
              onClick={() => performSearch(filters, Math.max(0, offset - limit))}
              disabled={offset === 0 || loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              onClick={() => performSearch(filters, offset + limit)}
              disabled={!hasMore || loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && total === 0 && filters.description === '' && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Use the filters above to search your transactions
          </p>
        </div>
      )}

      {!loading && results.length === 0 && total > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchPage;
