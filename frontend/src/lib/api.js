import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transactions
export const getTransactions = async (params = {}) => {
  const response = await api.get('/transactions', { params });
  return response.data;
};

export const getTransaction = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const deleteAllTransactions = async () => {
  const response = await api.delete('/transactions');
  return response.data;
};

// File Upload
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Budgets
export const getBudgets = async () => {
  const response = await api.get('/budgets');
  return response.data;
};

export const getBudgetStatus = async () => {
  const response = await api.get('/budgets/status/all');
  return response.data;
};

export const createBudget = async (data) => {
  const response = await api.post('/budgets', data);
  return response.data;
};

export const updateBudget = async (id, data) => {
  const response = await api.put(`/budgets/${id}`, data);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};

// Analytics
export const getAnalyticsSummary = async () => {
  const response = await api.get('/analytics/summary');
  return response.data;
};

export const getAnalyticsSummaryConverted = async (baseCurrency = 'INR') => {
  const response = await api.get('/analytics/summary/converted', {
    params: { base_currency: baseCurrency }
  });
  return response.data;
};

export const getCashFlowForecast = async (months = 6) => {
  const response = await api.get('/analytics/cash-flow', { params: { months } });
  return response.data;
};

export const getAnomalies = async () => {
  const response = await api.get('/analytics/anomalies');
  return response.data;
};

export const getCategoryBreakdown = async () => {
  const response = await api.get('/analytics/categories');
  return response.data;
};

// Tax
export const estimateTax = async (data) => {
  const response = await api.post('/tax/estimate', data);
  return response.data;
};

export const estimateTaxFromTransactions = async (params) => {
  const response = await api.get('/tax/estimate-from-transactions', { params });
  return response.data;
};

// Investments
export const getInvestmentSuggestions = async (currentSavings = 0) => {
  const response = await api.get('/investments/suggestions', { 
    params: { current_savings: currentSavings } 
  });
  return response.data;
};

// Reports
export const getMonthlyReport = async (year, month) => {
  const response = await api.get(`/reports/monthly/${year}/${month}`);
  return response.data;
};

export const getYearlyReport = async (year) => {
  const response = await api.get(`/reports/yearly/${year}`);
  return response.data;
};

// Categories
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

// Settings
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.put('/settings', data);
  return response.data;
};

// Currencies & Countries
export const getCurrencies = async () => {
  const response = await api.get('/currencies');
  return response.data;
};

export const getCountries = async () => {
  const response = await api.get('/countries');
  return response.data;
};

// ============== EXCHANGE RATE & CONVERSION APIs ==============
export const getExchangeRates = async (baseCurrency = 'USD') => {
  const response = await api.get(`/exchange/rates/${baseCurrency}`);
  return response.data;
};

export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  const response = await api.post('/exchange/convert', {
    amount,
    from_currency: fromCurrency,
    to_currency: toCurrency
  });
  return response.data;
};

export const batchConvertCurrencies = async (conversions) => {
  const response = await api.post('/exchange/batch-convert', { conversions });
  return response.data;
};

export const getHistoricalRates = async (fromCurrency, toCurrency, days = 30) => {
  const response = await api.get(`/exchange/historical/${fromCurrency}/${toCurrency}`, {
    params: { days }
  });
  return response.data;
};

export const getFxVolatility = async (fromCurrency, toCurrency, days = 30) => {
  const response = await api.get(`/exchange/volatility/${fromCurrency}/${toCurrency}`, {
    params: { days }
  });
  return response.data;
};

export const getAllCurrencies = async () => {
  const response = await api.get('/exchange/currencies/all');
  return response.data;
};

export const getPopularCurrencies = async () => {
  const response = await api.get('/exchange/popular');
  return response.data;
};

// Portfolio
export const getPortfolioAssets = async () => {
  const response = await api.get('/portfolio/assets');
  return response.data;
};

export const createPortfolioAsset = async (data) => {
  const response = await api.post('/portfolio/assets', data);
  return response.data;
};

export const deletePortfolioAsset = async (id) => {
  const response = await api.delete(`/portfolio/assets/${id}`);
  return response.data;
};

export const getPortfolioSummary = async (baseCurrency = 'INR') => {
  const response = await api.get('/portfolio/summary', {
    params: { base_currency: baseCurrency }
  });
  return response.data;
};

export const getPortfolioAllocation = async (baseCurrency = 'INR') => {
  const response = await api.get('/portfolio/allocation', {
    params: { base_currency: baseCurrency }
  });
  return response.data;
};

export const getTransactionsConverted = async (baseCurrency = 'INR', limit = 100) => {
  const response = await api.get('/transactions/converted', {
    params: { base_currency: baseCurrency, limit }
  });
  return response.data;
};

export default api;
