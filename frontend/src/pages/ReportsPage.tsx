import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { exportSpendingReportToExcel } from '../services/excelExport';

interface ReportMetadata {
  currentMonth: number;
  currentYear: number;
  availableYears: number[];
  trendMonths: number[];
}

const ReportsPage: React.FC = () => {
  const [metadata, setMetadata] = useState<ReportMetadata | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTrendMonths, setSelectedTrendMonths] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const response = await apiClient.get('/reports/metadata');
      setMetadata(response.data);
      setSelectedMonth(response.data.currentMonth);
      setSelectedYear(response.data.currentYear);
    } catch (error) {
      console.error('Failed to load report metadata:', error);
    }
  };

  const handleDownloadMonthlyPDF = async () => {
    try {
      setLoading(true);
      setDownloadMessage('');
      const response = await apiClient.get('/reports/monthly/pdf', {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `budget-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      setDownloadMessage('PDF downloaded successfully!');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      setDownloadMessage('Failed to download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMonthlyCSV = async () => {
    try {
      setLoading(true);
      setDownloadMessage('');
      const response = await apiClient.get('/reports/monthly/csv', {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `budget-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      setDownloadMessage('CSV downloaded successfully!');
    } catch (error) {
      console.error('Failed to download CSV:', error);
      setDownloadMessage('Failed to download CSV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAnnualCSV = async () => {
    try {
      setLoading(true);
      setDownloadMessage('');
      const response = await apiClient.get('/reports/annual/csv', {
        params: { year: selectedYear },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `annual-report-${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      setDownloadMessage('Annual report downloaded successfully!');
    } catch (error) {
      console.error('Failed to download annual report:', error);
      setDownloadMessage('Failed to download annual report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSpendingTrends = async () => {
    try {
      setLoading(true);
      setDownloadMessage('');
      const response = await apiClient.get('/reports/spending-trends/csv', {
        params: { months: selectedTrendMonths },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `spending-trends-${selectedTrendMonths}m.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      setDownloadMessage('Spending trends downloaded successfully!');
    } catch (error) {
      console.error('Failed to download spending trends:', error);
      setDownloadMessage('Failed to download spending trends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      setDownloadMessage('');

      // Fetch report data for Excel export
      const response = await apiClient.get('/reports/data', {
        params: { months: selectedTrendMonths },
      });

      if (response.data && Array.isArray(response.data)) {
        const reportData = response.data.map((item: any) => ({
          month: item.month || item.name,
          income: item.income || 0,
          expenses: item.expenses || 0,
          netCashFlow: (item.income || 0) - (item.expenses || 0),
          savingsRate: item.savingsRate || 0,
          topCategories: item.topCategories || [],
        }));

        exportSpendingReportToExcel(
          reportData,
          `spending-report-${new Date().toISOString().split('T')[0]}.xlsx`
        );

        setDownloadMessage('Excel file downloaded successfully!');
      } else {
        setDownloadMessage('No report data available to export.');
      }
    } catch (error) {
      console.error('Failed to export Excel:', error);
      setDownloadMessage('Failed to export to Excel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Reports & Analytics</h1>

      {downloadMessage && (
        <div
          className={`mb-6 p-4 rounded ${
            downloadMessage.includes('successfully')
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {downloadMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* Monthly Report Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Monthly Report</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Download a detailed report of your spending for a specific month.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {metadata?.availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDownloadMonthlyPDF}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
            >
              {loading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handleDownloadMonthlyCSV}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
            >
              {loading ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Annual Report Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Annual Report</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Download a comprehensive report covering all 12 months of a year.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {metadata?.availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadAnnualCSV}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition"
          >
            {loading ? 'Downloading...' : 'Download Annual Report (CSV)'}
          </button>
        </div>

        {/* Spending Trends Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Spending Trends</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Analyze your spending patterns over multiple months.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Period</label>
            <select
              value={selectedTrendMonths}
              onChange={(e) => setSelectedTrendMonths(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {metadata?.trendMonths.map((months) => (
                <option key={months} value={months}>
                  Last {months} months
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadSpendingTrends}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
          >
            {loading ? 'Downloading...' : 'Download Spending Trends (CSV)'}
          </button>
        </div>

        {/* Excel Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">📊 Export to Excel</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Export your spending data to Excel for detailed analysis and record-keeping. Perfect for use in spreadsheets or data analysis tools.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Period</label>
            <select
              value={selectedTrendMonths}
              onChange={(e) => setSelectedTrendMonths(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {metadata?.trendMonths.map((months) => (
                <option key={months} value={months}>
                  Last {months} months
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportToExcel}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
          >
            {loading ? 'Exporting...' : '📥 Export to Excel (.xlsx)'}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Excel files include multiple sheets for different report views (Summary, Category Details, etc.)
          </p>
        </div>

        {/* Information Section */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Report Information</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• PDF reports include formatted summaries and charts</li>
            <li>• CSV files can be imported into spreadsheets for further analysis</li>
            <li>• Reports include all transactions and budget information</li>
            <li>• Generated reports are based on your current data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
