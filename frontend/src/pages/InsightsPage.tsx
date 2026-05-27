import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface Anomaly {
  categoryId: number;
  categoryName: string;
  amount: number;
  expectedAmount: number;
  percentageDeviation: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface Insight {
  type: 'savings' | 'warning' | 'trend' | 'opportunity';
  title: string;
  description: string;
  impact: number;
  recommendation: string;
}

interface PredictedExpense {
  categoryId: number;
  categoryName: string;
  predictedAmount: number;
  confidence: number;
}

const InsightsPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [predictions, setPredictions] = useState<PredictedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadInsightsData();
  }, [selectedMonth, selectedYear]);

  const loadInsightsData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [anomaliesRes, insightsRes, predictionsRes] = await Promise.all([
        apiClient.get(`/insights/anomalies/${selectedYear}/${selectedMonth}`),
        apiClient.get('/insights/generate'),
        apiClient.get('/insights/predict-next-month'),
      ]);

      setAnomalies(anomaliesRes.data || []);
      setInsights(insightsRes.data || []);
      setPredictions(predictionsRes.data || []);
    } catch (err: any) {
      console.error('Failed to load insights:', err);
      setError('Failed to load insights data');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'medium':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'low':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'bg-green-50';
      case 'warning':
        return 'bg-red-50';
      case 'trend':
        return 'bg-blue-50';
      case 'opportunity':
        return 'bg-purple-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'trend':
        return '📊';
      case 'opportunity':
        return '💡';
      default:
        return '📌';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading insights...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Insights & Predictions</h1>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Smart Insights</h2>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className={`border border-gray-200 rounded p-4 ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{insight.title}</h3>
                    <p className="text-gray-700 mt-1">{insight.description}</p>
                    <p className="text-sm text-gray-600 mt-2 font-semibold">💡 {insight.recommendation}</p>
                    {insight.impact && <div className="text-xs text-gray-600 mt-2">Impact: {insight.impact.toFixed(1)}%</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Spending Anomalies</h2>
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div key={anomaly.categoryId} className={`border-l-4 p-4 rounded ${getSeverityColor(anomaly.severity)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{anomaly.categoryName}</h3>
                    <p className="text-sm mt-1">{anomaly.message}</p>
                    <div className="text-xs mt-2">
                      Current: ${Number(anomaly.amount).toFixed(2)} | Expected: ${Number(anomaly.expectedAmount).toFixed(2)}
                    </div>
                  </div>
                  <span className="text-lg font-bold">{anomaly.percentageDeviation > 0 ? '+' : ''}{anomaly.percentageDeviation}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Month Predictions */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Predicted Next Month Spending</h2>
          <div className="space-y-3">
            {predictions
              .sort((a, b) => b.predictedAmount - a.predictedAmount)
              .map((prediction) => (
                <div key={prediction.categoryId} className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">{prediction.categoryName}</h3>
                    <span className="text-lg font-bold text-blue-600">${Number(prediction.predictedAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded h-2">
                      <div
                        className="bg-blue-600 h-2 rounded"
                        style={{ width: `${Math.min(prediction.confidence, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{prediction.confidence.toFixed(0)}% confidence</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {anomalies.length === 0 && insights.length === 0 && predictions.length === 0 && (
        <div className="text-center py-8 text-gray-600">No insights available. Add more transactions to unlock AI-powered insights.</div>
      )}
    </div>
  );
};

export default InsightsPage;
