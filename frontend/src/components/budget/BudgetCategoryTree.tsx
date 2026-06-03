import React, { useState } from 'react';
import { ChevronDown, Edit2, Trash2 } from 'lucide-react';
import BudgetBar from './BudgetBar';
import BudgetInput from './BudgetInput';

interface CategoryItem {
  id: number;
  name: string;
  icon?: string;
  spent: number;
  budget: number;
  children?: CategoryItem[];
}

interface BudgetCategoryTreeProps {
  categories: CategoryItem[];
  onBudgetUpdate?: (categoryId: number, amount: number) => Promise<void>;
  isLoading?: boolean;
  currency?: string;
  onQuickAddSpending?: (categoryId: number, amount: string) => Promise<void>;
  categorySpending?: { [key: number]: string };
  onCategorySpendingChange?: (categoryId: number, value: string) => void;
  submittingCategories?: Set<number>;
}

const BudgetCategoryTree: React.FC<BudgetCategoryTreeProps> = ({
  categories,
  onBudgetUpdate,
  isLoading = false,
  currency = 'USD',
  onQuickAddSpending,
  categorySpending = {},
  onCategorySpendingChange,
  submittingCategories = new Set(),
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleBudgetUpdate = async (categoryId: number, amount: number) => {
    try {
      if (onBudgetUpdate) {
        await onBudgetUpdate(categoryId, amount);
      }
      setEditingCategoryId(null);
    } catch (err) {
      console.error('Failed to update budget:', err);
    }
  };

  const renderCategory = (category: CategoryItem, depth: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isEditing = editingCategoryId === category.id;

    return (
      <div key={category.id} className={`${depth > 0 ? 'ml-4' : ''}`}>
        {isEditing ? (
          <div className="mb-4">
            <BudgetInput
              categoryName={category.name}
              currentBudget={category.budget}
              onSave={(amount) =>
                handleBudgetUpdate(category.id, amount)
              }
              onCancel={() => setEditingCategoryId(null)}
              isLoading={isLoading}
              currency={currency}
            />
          </div>
        ) : (
          <div
            className="mb-3 group"
            onClick={() => hasChildren && toggleExpanded(category.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              {hasChildren && (
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              )}
              {!hasChildren && <div className="w-4" />}

              <div className="flex-1">
                <BudgetBar
                  categoryName={category.name}
                  spent={category.spent}
                  budget={category.budget}
                  icon={category.icon}
                  isExpanded={isExpanded}
                  onClick={hasChildren ? () => toggleExpanded(category.id) : undefined}
                  currency={currency}
                  categoryId={category.id}
                  onQuickAddSpending={onQuickAddSpending}
                  quickAddValue={categorySpending[category.id] || ''}
                  onQuickAddChange={(value) => onCategorySpendingChange?.(category.id, value)}
                  isSubmitting={submittingCategories.has(category.id)}
                />
              </div>

              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategoryId(category.id);
                }}
                className="flex items-center justify-center p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Edit budget amount"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete ${category.name}? This cannot be undone.`)) {
                    // Placeholder - actual deletion will be handled by parent component
                    console.log('Delete category:', category.id);
                  }
                }}
                className="flex items-center justify-center p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Subcategories */}
            {hasChildren && isExpanded && (
              <div className="space-y-3">
                {category.children!.map((child) =>
                  renderCategory(child, depth + 1)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center backdrop-blur-sm">
        <p className="text-slate-400">No categories available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => renderCategory(category))}
    </div>
  );
};

export default BudgetCategoryTree;
