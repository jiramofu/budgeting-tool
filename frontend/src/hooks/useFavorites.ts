import { useState, useEffect } from 'react';

export interface FavoriteItem {
  id: string;
  type: 'report' | 'dashboard' | 'budget' | 'transaction' | 'custom';
  name: string;
  icon?: string;
  path?: string;
  createdAt: number;
}

/**
 * Custom hook for managing user favorites/bookmarks
 * Persists to localStorage for cross-session access
 */
export const useFavorites = () => {
  const STORAGE_KEY = 'app_favorites';
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (err) {
        console.error('Failed to save favorites:', err);
      }
    }
  }, [favorites, isLoading]);

  /**
   * Add a favorite item
   */
  const addFavorite = (item: Omit<FavoriteItem, 'createdAt'>) => {
    const newFavorite: FavoriteItem = {
      ...item,
      createdAt: Date.now(),
    };
    setFavorites((prev) => {
      // Avoid duplicates
      if (prev.find((f) => f.id === item.id && f.type === item.type)) {
        return prev;
      }
      return [...prev, newFavorite];
    });
    return newFavorite;
  };

  /**
   * Remove a favorite by id
   */
  const removeFavorite = (id: string, type: FavoriteItem['type']) => {
    setFavorites((prev) => prev.filter((f) => !(f.id === id && f.type === type)));
  };

  /**
   * Check if an item is favorited
   */
  const isFavorited = (id: string, type: FavoriteItem['type']): boolean => {
    return favorites.some((f) => f.id === id && f.type === type);
  };

  /**
   * Toggle favorite status
   */
  const toggleFavorite = (item: Omit<FavoriteItem, 'createdAt'>) => {
    if (isFavorited(item.id, item.type)) {
      removeFavorite(item.id, item.type);
      return false;
    } else {
      addFavorite(item);
      return true;
    }
  };

  /**
   * Get all favorites of a specific type
   */
  const getFavoritesByType = (type: FavoriteItem['type']): FavoriteItem[] => {
    return favorites.filter((f) => f.type === type).sort((a, b) => b.createdAt - a.createdAt);
  };

  /**
   * Clear all favorites
   */
  const clearAllFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorited,
    toggleFavorite,
    getFavoritesByType,
    clearAllFavorites,
  };
};
