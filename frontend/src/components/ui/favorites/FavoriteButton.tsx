import React from 'react';
import { Star } from 'lucide-react';
import { useFavorites, FavoriteItem } from '../../../hooks/useFavorites';
import { useToast } from '../../../hooks/useToast';
import { Tooltip } from '../tooltip';

interface FavoriteButtonProps {
  id: string;
  type: FavoriteItem['type'];
  name: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onToggle?: (isFavorited: boolean) => void;
}

/**
 * Star icon button to toggle favorite status
 * Shows filled star when favorited, outline when not
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  id,
  type,
  name,
  className = '',
  showLabel = false,
  size = 'md',
  onToggle,
}) => {
  const { isFavorited, toggleFavorite } = useFavorites();
  const { success } = useToast();
  const favorited = isFavorited(id, type);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newState = toggleFavorite({ id, type, name });

    if (newState) {
      success(`Added "${name}" to favorites`);
    } else {
      success(`Removed "${name}" from favorites`);
    }

    onToggle?.(newState);
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const tooltipText = favorited
    ? `Remove "${name}" from favorites`
    : `Add "${name}" to favorites`;

  return (
    <Tooltip content={tooltipText} position="top">
      <button
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 rounded-lg transition-all duration-200
          ${buttonSizeClasses[size]}
          ${favorited
            ? 'text-yellow-400 hover:text-yellow-300 active:scale-95'
            : 'text-slate-400 hover:text-yellow-400 active:scale-95'
          }
          focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900
          ${className}
        `}
        title={tooltipText}
        aria-label={`Toggle favorite for ${name}`}
      >
        <Star
          className={`${sizeClasses[size]} ${favorited ? 'fill-current' : 'fill-none stroke-current stroke-2'}`}
        />
        {showLabel && (
          <span className="text-xs font-medium whitespace-nowrap">
            {favorited ? 'Favorited' : 'Favorite'}
          </span>
        )}
      </button>
    </Tooltip>
  );
};

export default FavoriteButton;
