import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, getCurrencies } from '@/lib/api';

const CURRENCY_DATA = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', position: 'before' },
  INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', position: 'before' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE', position: 'before' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB', position: 'before' },
  JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', position: 'before' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', position: 'before' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', position: 'before' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', position: 'after' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', position: 'before' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', position: 'before' },
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState('INR'); // Default to INR
  const [country, setCountryState] = useState('IN'); // Default to India
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings.currency) setCurrencyState(settings.currency);
        if (settings.country) setCountryState(settings.country);
      } catch (error) {
        console.log('Using default currency settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const setCurrency = useCallback(async (newCurrency) => {
    setCurrencyState(newCurrency);
    try {
      await updateSettings({ currency: newCurrency });
    } catch (error) {
      console.error('Failed to save currency setting');
    }
  }, []);

  const setCountry = useCallback(async (newCountry) => {
    setCountryState(newCountry);
    try {
      await updateSettings({ country: newCountry });
    } catch (error) {
      console.error('Failed to save country setting');
    }
  }, []);

  const formatCurrency = useCallback((value, options = {}) => {
    const { 
      showSymbol = true, 
      compact = false,
      decimals = 2,
      currencyOverride = null
    } = options;
    
    const curr = currencyOverride || currency;
    const currencyInfo = CURRENCY_DATA[curr] || CURRENCY_DATA.USD;
    
    if (value === null || value === undefined || isNaN(value)) {
      return showSymbol ? `${currencyInfo.symbol}0` : '0';
    }

    const absValue = Math.abs(value);
    let formattedNumber;

    if (compact && absValue >= 10000000) {
      // Crore (Indian) or 10M
      if (curr === 'INR') {
        formattedNumber = (absValue / 10000000).toFixed(1) + 'Cr';
      } else {
        formattedNumber = (absValue / 1000000).toFixed(1) + 'M';
      }
    } else if (compact && absValue >= 100000) {
      // Lakh (Indian) or 100K
      if (curr === 'INR') {
        formattedNumber = (absValue / 100000).toFixed(1) + 'L';
      } else {
        formattedNumber = (absValue / 1000).toFixed(0) + 'K';
      }
    } else if (compact && absValue >= 1000) {
      formattedNumber = (absValue / 1000).toFixed(1) + 'K';
    } else {
      // Use locale formatting
      formattedNumber = new Intl.NumberFormat(currencyInfo.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(absValue);
    }

    const sign = value < 0 ? '-' : '';
    
    if (!showSymbol) {
      return `${sign}${formattedNumber}`;
    }

    if (currencyInfo.position === 'after') {
      return `${sign}${formattedNumber} ${currencyInfo.symbol}`;
    }
    
    return `${sign}${currencyInfo.symbol}${formattedNumber}`;
  }, [currency]);

  const getCurrencySymbol = useCallback(() => {
    return CURRENCY_DATA[currency]?.symbol || '$';
  }, [currency]);

  const getCurrencyInfo = useCallback(() => {
    return CURRENCY_DATA[currency] || CURRENCY_DATA.USD;
  }, [currency]);

  const value = {
    currency,
    setCurrency,
    country,
    setCountry,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyInfo,
    loading,
    currencies: Object.entries(CURRENCY_DATA).map(([code, data]) => ({
      code,
      ...data
    }))
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;
