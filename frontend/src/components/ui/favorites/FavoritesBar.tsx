import React, { useState } from 'react';
import { Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFavorites, FavoriteItem } from '../../../hooks/useFavorites';
import { useToast } from '../../../hooks/useToast';
import { Tooltip } from '../tooltip';

interface FavoritesBarProps {
  onSelect?: (favorite: FavoriteItem) => void;
  maxVisible?: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * Horizontal bar showing user's favorite items with quick access
 * Scrollable on smaller screens, shows remove button on hover
 */
const FavoritesBar: React.FC<FavoritesBarProps> = ({
  onSelect,
  maxVisible = 6,
  className = '',
  showLabel = true,
}) => {
  const { favorites, removeFavorite } = useFavorites();
  const { info } = useToast();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (favorites.length === 0) {
    return null;
  }

  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;

    const scrollAmount = 200;
    const newPosition =
      direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

    containerRef.current.scrollLeft = newPosition;
    setScrollPosition(newPosition);
  };

  const handleSelectFavorite = (favorite: FavoriteItem) => {
    if (favorite.path) {
      window.location.pathname = favorite.path;
      info(`Navigating to ${favorite.name}`);
    }
    onSelect?.(favorite);
  };

  const handleRemove = (
    e: React.MouseEvent,
    id: string,
    type: FavoriteItem['type']
  ) => {
    e.stopPropagation();
    removeFavorite(id, type);
    info('Favorite removed');
  };

  // Sort by most recent
  const sortedFavorites = [...favorites].sort((a, b) => b.createdAt - a.createdAt);
  const visibleFavorites = sortedFavorites.slice(0, maxVisible);
  const hasMore = favorites.length > maxVisible;

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-3
        bg-slate-800/50 border border-slate-700 rounded-lg
        backdrop-blur-sm
        ${className}
      `}
    >
      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />

      <div className="text-sm font-medium text-slate-400 min-w-fit">
        {showLabel && 'Favorites:'}
      </div>

      {/* Favorites container */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide"
        >
          {visibleFavorites.map((favorite) => (
            <Tooltip
              key={`${favorite.type}-${favorite.id}`}
              content={favorite.name}
              position="top"
              delay={200}
            >
              <button
                onClick={() => handleSelectFavorite(favorite)}
                onMouseEnter={() =>
                  setHoveredId(`${favorite.type}-${favorite.id}`)
                }
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 rounded-md
                  flex-shrink-0 whitespace-nowrap text-xs font-medium
                  transition-all duration-200
                  bg-slate-700/50 hover:bg-slate-600
                  text-slate-200 hover:text-slate-50
                  focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900
                `}
              >
                <span className="w-3 h-3 flex-shrink-0">
                  {favorite.icon ? (
                    favorite.icon
                  ) : (
                    <Star className="w-3 h-3 text-yellow-400" />
                  )}
                </span>
                <span className="truncate max-w-[120px]">{favorite.name}</span>

                {/* Remove button on hover */}
                {hoveredId === `${favorite.type}-${favorite.id}` && (
                  <button
                    onClick={(e) =>
                      handleRemove(e, favorite.id, favorite.type)
                    }
                    className="ml-1 p-0.5 hover:bg-red-600/50 rounded transition-colors"
                    title="Remove from favorites"
                    aria-label={`Remove ${favorite.name} from favorites`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Scroll buttons */}
      {hasMore && (
        <>
          <button
            onClick={() => scroll('left')}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
            title="Scroll favorites left"
            aria-label="Scroll favorites left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => scroll('right')}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
            title="Scroll favorites right"
            aria-label="Scroll favorites right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Count badge */}
      <div className="ml-2 px-2 py-0.5 rounded bg-slate-700 text-xs font-semibold text-slate-300 flex-shrink-0">
        {favorites.length}
      </div>
    </div>
  );
};

export default FavoritesBar;
