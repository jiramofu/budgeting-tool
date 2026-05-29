import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);

  // Load currency from localStorage or backend on mount
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        setIsLoading(true);
        // Try to get from localStorage first
        const stored = localStorage.getItem('userCurrency');
        if (stored) {
          setCurrencyState(stored);
        } else {
          // Fall back to fetching from backend
          try {
            const settings = await apiClient.getUserSettings();
            const userCurrency = settings.data?.currency || 'USD';
            setCurrencyState(userCurrency);
            localStorage.setItem('userCurrency', userCurrency);
          } catch {
            // If backend fetch fails, use default
            setCurrencyState('USD');
            localStorage.setItem('userCurrency', 'USD');
          }
        }
      } catch (err) {
        console.error('Error loading currency:', err);
        setCurrencyState('USD');
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrency();
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('userCurrency', newCurrency);
  };

  // Currency symbol mapping
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    MXN: '$',
    BRL: 'R$',
    SGD: 'S$',
    HKD: 'HK$',
    NZD: 'NZ$',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    ZAR: 'R',
    RUB: '₽',
  };

  const formatCurrency = (amount: number): string => {
    const symbol = currencySymbols[currency] || currency;

    // Format with thousand separators and 2 decimal places
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
