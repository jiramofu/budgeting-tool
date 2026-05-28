import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Command, X, TrendingUp, Wallet, FileText, HelpCircle } from 'lucide-react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: 'transaction' | 'budget' | 'report' | 'help' | 'command';
  icon: React.ReactNode;
  onSelect: () => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: SearchResult[];
  onSearch?: (query: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, results, onSearch }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return results.slice(0, 8); // Show top 8 by default
    }

    const lowerQuery = query.toLowerCase();
    return results
      .filter(
        (result) =>
          result.title.toLowerCase().includes(lowerQuery) ||
          result.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [query, results]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredResults.length) % filteredResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          filteredResults[selectedIndex].onSelect();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    result.onSelect();
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div className="w-full max-w-2xl mx-4 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in duration-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search transactions, budgets, reports..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-slate-50 placeholder-slate-400 outline-none text-base"
              aria-label="Search"
              autoComplete="off"
            />
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-slate-400">No results found for "{query}"</p>
              </div>
            ) : (
              <ul className="py-2">
                {filteredResults.map((result, index) => (
                  <li key={result.id}>
                    <button
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-3 ${
                        index === selectedIndex
                          ? 'bg-blue-600/20 text-slate-50'
                          : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-400">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        {result.description && (
                          <p className="text-xs text-slate-400 truncate">{result.description}</p>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex-shrink-0">
                        {result.category}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer with keyboard hints */}
          <div className="border-t border-slate-700 px-4 py-2 text-xs text-slate-500 flex items-center justify-between bg-slate-900/50">
            <span>
              {isMac ? '⌘' : 'Ctrl'}+K to search • ↑↓ to navigate • Enter to select • Esc to close
            </span>
            <div className="flex gap-2">
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3" />
                K
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;
