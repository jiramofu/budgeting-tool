import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface BudgetTemplate {
  id: number;
  name: string;
  description?: string;
  templateType: string;
  categoryStructure: any;
  targetPercentages: any;
  isDefault: boolean;
}

interface BudgetTemplatesDiscoveryProps {
  onTemplateApplied?: () => void;
  budgetId?: number;
}

const BudgetTemplatesDiscovery: React.FC<BudgetTemplatesDiscoveryProps> = ({
  onTemplateApplied,
  budgetId,
}) => {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  const templateTypes = [
    { value: '', label: 'All Templates' },
    { value: 'minimalist', label: '🏠 Minimalist', icon: '🏠' },
    { value: 'comfortable', label: '✨ Comfortable', icon: '✨' },
    { value: 'luxury', label: '💎 Luxury', icon: '💎' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'student', label: '🎓 Student', icon: '🎓' },
    { value: 'retirement', label: '🌴 Retirement', icon: '🌴' },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.get('/api/templates');
      setTemplates(response.data.data?.templates || response.data.data || []);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = filterType
    ? templates.filter((t) => t.templateType === filterType)
    : templates;

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    // If no budgetId provided, redirect to budgets page
    if (!budgetId) {
      alert('Please select a budget to apply this template to');
      return;
    }

    try {
      setApplying(true);
      setError('');

      await apiClient.post(`/api/templates/${selectedTemplate.id}/apply`, {
        budgetId,
        customizations: {},
      });

      alert('Template applied successfully!');
      setSelectedTemplate(null);
      onTemplateApplied?.();
    } catch (err: any) {
      console.error('Error applying template:', err);
      setError(err.response?.data?.error || 'Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {templateTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              filterType === type.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {type.icon && <span className="mr-2">{type.icon}</span>}
            {type.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            {/* Template Type Icon */}
            <div className="text-4xl mb-3">
              {template.templateType === 'minimalist' && '🏠'}
              {template.templateType === 'comfortable' && '✨'}
              {template.templateType === 'luxury' && '💎'}
              {template.templateType === 'family' && '👨‍👩‍👧‍👦'}
              {template.templateType === 'student' && '🎓'}
              {template.templateType === 'retirement' && '🌴'}
              {template.templateType === 'custom' && '📋'}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {template.name}
              {template.isDefault && (
                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  Default
                </span>
              )}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {template.description}
            </p>

            {/* Category Count */}
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {template.categoryStructure && typeof template.categoryStructure === 'object'
                ? `${Object.keys(template.categoryStructure).length} categories`
                : 'Multiple categories'}
            </div>

            {/* Sample Categories */}
            {template.categoryStructure && typeof template.categoryStructure === 'object' && (
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-4 max-h-32 overflow-hidden">
                {Object.entries(template.categoryStructure)
                  .slice(0, 4)
                  .map(([categoryName]) => (
                    <div key={categoryName} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      {categoryName}
                    </div>
                  ))}
                {Object.keys(template.categoryStructure).length > 4 && (
                  <div className="text-gray-500 dark:text-gray-500 italic">
                    +{Object.keys(template.categoryStructure).length - 4} more
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Template Details & Apply */}
      {selectedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky bottom-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {selectedTemplate.name}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {selectedTemplate.description}
          </p>

          {/* Categories Preview */}
          {selectedTemplate.categoryStructure && typeof selectedTemplate.categoryStructure === 'object' && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Categories Included:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(selectedTemplate.categoryStructure).map(([categoryName, data]: [string, any]) => {
                  const percentage = selectedTemplate.targetPercentages?.[categoryName] || 0;
                  return (
                    <div
                      key={categoryName}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{categoryName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {percentage}% budget
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-2">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={handleApplyTemplate}
              disabled={applying || !budgetId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply Template'}
            </button>
          </div>

          {!budgetId && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
              ⚠️ Please select a budget to apply this template
            </p>
          )}
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          No templates found for the selected category
        </div>
      )}
    </div>
  );
};

export default BudgetTemplatesDiscovery;
