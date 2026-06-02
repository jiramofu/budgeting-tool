import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

// Simple in-memory cache to reduce API calls (cache for 5 minutes)
const priceCache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class InvestmentStockService {
  static async getStockPrice(ticker: string): Promise<StockQuote> {
    try {
      // Validate ticker format
      if (!ticker || typeof ticker !== 'string' || ticker.length > 10) {
        throw new Error('Invalid ticker symbol');
      }

      const upperTicker = ticker.toUpperCase().trim();

      // Check cache first
      const cached = priceCache.get(upperTicker);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Stock Service] Cache hit for ${upperTicker}`);
        return cached.data;
      }

      if (!ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      console.log(`[Stock Service] Fetching price for ${upperTicker} from Alpha Vantage`);

      const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: upperTicker,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 5000, // 5 second timeout
      });

      const quoteData = response.data['Global Quote'];
      if (!quoteData || Object.keys(quoteData).length === 0) {
        throw new Error(`No data found for ticker ${upperTicker}`);
      }

      const currentPrice = parseFloat(quoteData['05. price']);
      const change = parseFloat(quoteData['09. change'] || '0');
      const changePercent = parseFloat(quoteData['10. change percent']?.replace('%', '') || '0');

      // Validate response
      if (currentPrice === undefined || currentPrice === null || currentPrice === 0) {
        throw new Error(`No valid price data for ticker ${upperTicker}`);
      }

      const stockQuote: StockQuote = {
        symbol: upperTicker,
        currentPrice: Number(currentPrice),
        change: Number(change || 0),
        changePercent: Number(changePercent || 0),
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      priceCache.set(upperTicker, {
        data: stockQuote,
        timestamp: Date.now(),
      });

      return stockQuote;
    } catch (error: any) {
      console.error(`[Stock Service] Error fetching price for ${ticker}:`, error.message);
      throw new Error(`Failed to fetch stock price: ${error.message}`);
    }
  }

  // Get multiple stock prices at once
  static async getStockPrices(tickers: string[]): Promise<StockQuote[]> {
    try {
      const results = await Promise.all(
        tickers.map((ticker) =>
          this.getStockPrice(ticker).catch((err) => {
            console.warn(`Failed to fetch ${ticker}:`, err.message);
            return null;
          })
        )
      );

      return results.filter((result): result is StockQuote => result !== null);
    } catch (error: any) {
      console.error('[Stock Service] Error fetching multiple prices:', error.message);
      throw error;
    }
  }
}
