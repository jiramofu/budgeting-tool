import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: Array<{
    name: string;
    type: 'fixed' | 'variable' | 'recurring';
    suggestedPercentage?: number;
  }>;
}

interface CategorySuggestion {
  name: string;
  frequency: number;
  confidence: number;
  type: 'fixed' | 'variable' | 'recurring';
}

const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError('');

      const templatesRes = await apiClient.get('/api/templates');
      setTemplates(templatesRes.data);

      try {
        const suggestionsRes = await apiClient.get('/api/templates/suggestions/categories');
        setSuggestions(suggestionsRes.data);
      } catch (err) {
        // Suggestions are optional
      }
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError('Failed to load budget templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    try {
      setError('');

      // Get current budget
      const budgetRes = await apiClient.getCurrentBudget();
      const budgetId = budgetRes.data?.id;

      if (!budgetId || !selectedTemplate) {
        setError('Budget not found');
        return;
      }

      await apiClient.get(`/api/templates/${selectedTemplate.id}/apply`, {
        data: { budgetId },
      });

      setShowApplyConfirm(false);
      setSelectedTemplate(null);
      // Optionally reload or redirect
      window.location.href = '/';
    } catch (err: any) {
      console.error('Failed to apply template:', err);
      setError('Failed to apply template');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading budget templates...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Budget Templates</h1>
        <p className="text-gray-600">
          Choose a pre-built budget template to get started quickly with recommended categories and spending percentages.
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-4xl mb-3">{template.icon}</div>
            <h3 className="text-lg font-bold mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="text-xs text-gray-500">
              {template.categories.length} categories included
            </div>
          </button>
        ))}
      </div>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="text-4xl">{selectedTemplate.icon}</span>
            {selectedTemplate.name}
          </h2>

          <p className="text-gray-600 mb-6">{selectedTemplate.description}</p>

          <div className="mb-6">
            <h3 className="font-bold mb-3">Categories ({selectedTemplate.categories.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.categories.map((category, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{category.type}</p>
                    </div>
                    {category.suggestedPercentage && (
                      <span className="text-sm font-bold text-blue-600">
                        {category.suggestedPercentage}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowApplyConfirm(true)}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Apply This Template
          </button>
        </div>
      )}

      {/* Category Suggestions */}
      {suggestions.length > 0 && !selectedTemplate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Suggested Categories</h2>
          <p className="text-gray-600 mb-4">
            Based on your transaction history, we recommend these categories:
          </p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{suggestion.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{suggestion.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{suggestion.frequency} transactions</p>
                  <p className="text-xs text-gray-500">{suggestion.confidence}% confidence</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Template Selected Message */}
      {!selectedTemplate && templates.length > 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            Select a budget template above to see detailed information and apply it to your budget.
          </p>
        </div>
      )}

      {/* Apply Confirmation Dialog */}
      {showApplyConfirm && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Apply Template?</h3>
            <p className="text-gray-600 mb-6">
              This will add {selectedTemplate.categories.length} categories to your budget. You can edit or remove
              them later.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowApplyConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
