import React from 'react';
import { BarChart3, PieChart, TrendingUp, FileText } from 'lucide-react';

export type ReportType = 'spending-trend' | 'category-breakdown' | 'monthly-comparison' | 'summary';

interface ReportTabsProps {
  activeReport: ReportType;
  onReportChange: (report: ReportType) => void;
}

const ReportTabs: React.FC<ReportTabsProps> = ({ activeReport, onReportChange }) => {
  const tabs: { id: ReportType; label: string; icon: React.ReactNode }[] = [
    { id: 'spending-trend', label: 'Spending Trend', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'category-breakdown', label: 'Categories', icon: <PieChart className="w-4 h-4" /> },
    { id: 'monthly-comparison', label: 'Monthly', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onReportChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeReport === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ReportTabs;
