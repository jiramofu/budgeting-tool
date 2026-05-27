import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface PopularSearch {
  term: string;
  count: number;
}

interface SearchAnalyticsProps {
  title?: string;
  showTitle?: boolean;
}

const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  title = 'Popular Searches',
  showTitle = true,
}) => {
  const [popularTerms, setPopularTerms] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPopularSearches();
  }, []);

  const loadPopularSearches = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.get('/api/search/popular', {
        params: { limit: 10 },
      });

      setPopularTerms(response.data.data?.terms || []);
    } catch (err: any) {
      console.error('Error loading popular searches:', err);
      setError('Failed to load search analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="text-gray-600 dark:text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || popularTerms.length === 0) {
    return null;
  }

  const maxCount = Math.max(...popularTerms.map((t) => t.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {showTitle && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
      )}

      <div className="space-y-3">
        {popularTerms.map((search, index) => {
          const percentage = (search.count / maxCount) * 100;

          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {search.term || '(blank searches)'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {search.count} searches
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Based on user searches across all transactions. Search analytics help identify common patterns and improve discoverability.
        </p>
      </div>
    </div>
  );
};

export default SearchAnalytics;
