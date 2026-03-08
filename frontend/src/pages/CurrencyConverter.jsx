import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRightLeft, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Clock,
  Globe,
  Wallet,
  Plus,
  Trash2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  convertCurrency, 
  getExchangeRates, 
  getHistoricalRates, 
  getFxVolatility,
  getAllCurrencies,
  getPopularCurrencies,
  getPortfolioSummary,
  getPortfolioAllocation,
  createPortfolioAsset,
  deletePortfolioAsset
} from "@/lib/api";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

export const CurrencyConverter = () => {
  const { currency: baseCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [popularCurrencies, setPopularCurrencies] = useState([]);
  const [conversionResult, setConversionResult] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [volatility, setVolatility] = useState(null);
  const [ratesInfo, setRatesInfo] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  
  // Converter form
  const [amount, setAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState(baseCurrency || "INR");
  
  // New asset form
  const [newAsset, setNewAsset] = useState({
    name: "",
    amount: "",
    currency: "USD",
    category: "Cash",
    notes: ""
  });

  const fetchCurrencies = useCallback(async () => {
    try {
      const [allCurr, popCurr] = await Promise.all([
        getAllCurrencies(),
        getPopularCurrencies()
      ]);
      setCurrencies(allCurr.currencies || []);
      setPopularCurrencies(popCurr.currencies || []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const [summary, alloc] = await Promise.all([
        getPortfolioSummary(baseCurrency),
        getPortfolioAllocation(baseCurrency)
      ]);
      setPortfolio(summary);
      setAllocation(alloc);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  }, [baseCurrency]);

  useEffect(() => {
    fetchCurrencies();
    fetchPortfolio();
  }, [fetchCurrencies, fetchPortfolio]);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const result = await convertCurrency(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );
      setConversionResult(result);

      // Fetch historical and volatility data
      const [historical, vol, rates] = await Promise.all([
        getHistoricalRates(fromCurrency, toCurrency, 30),
        getFxVolatility(fromCurrency, toCurrency, 30),
        getExchangeRates(fromCurrency)
      ]);

      setHistoricalData(historical.data || []);
      setVolatility(vol);
      setRatesInfo(rates);
    } catch (error) {
      console.error("Error converting:", error);
      toast.error("Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConversionResult(null);
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await createPortfolioAsset({
        ...newAsset,
        amount: parseFloat(newAsset.amount)
      });
      toast.success("Asset added to portfolio");
      setIsAddAssetOpen(false);
      setNewAsset({ name: "", amount: "", currency: "USD", category: "Cash", notes: "" });
      fetchPortfolio();
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error("Failed to add asset");
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await deletePortfolioAsset(id);
      toast.success("Asset removed");
      fetchPortfolio();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to remove asset");
    }
  };

  const getVolatilityColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="currency-converter-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Currency Converter</h1>
        <p className="text-muted-foreground">
          Real-time exchange rates with 160+ currencies
        </p>
      </div>

      <Tabs defaultValue="converter" className="space-y-6">
        <TabsList className="tab-list" data-testid="converter-tabs">
          <TabsTrigger value="converter" className="tab-trigger">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Converter
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="tab-trigger">
            <Wallet className="w-4 h-4 mr-2" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="rates" className="tab-trigger">
            <Globe className="w-4 h-4 mr-2" />
            Live Rates
          </TabsTrigger>
        </TabsList>

        {/* Converter Tab */}
        <TabsContent value="converter" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Converter Card */}
            <Card className="chart-container" data-testid="converter-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                  Convert Currency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="text-lg font-mono"
                    data-testid="converter-amount"
                  />
                </div>

                {/* Currency Selectors */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>From</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger data-testid="from-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {currencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            <span className="flex items-center gap-2">
                              <span className="font-mono w-8">{curr.symbol}</span>
                              <span>{curr.code}</span>
                              <span className="text-muted-foreground text-xs truncate max-w-[100px]">
                                {curr.name}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="mt-6"
                    onClick={swapCurrencies}
                    data-testid="swap-currencies"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex-1 space-y-2">
                    <Label>To</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger data-testid="to-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {currencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            <span className="flex items-center gap-2">
                              <span className="font-mono w-8">{curr.symbol}</span>
                              <span>{curr.code}</span>
                              <span className="text-muted-foreground text-xs truncate max-w-[100px]">
                                {curr.name}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleConvert} 
                  className="w-full" 
                  disabled={loading}
                  data-testid="convert-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert"
                  )}
                </Button>

                {/* Result */}
                {conversionResult && (
                  <div className="mt-6 p-6 bg-primary/10 border border-primary/30 rounded-xl" data-testid="conversion-result">
                    <p className="text-sm text-muted-foreground mb-2">Result</p>
                    <p className="text-3xl font-bold font-mono">
                      {conversionResult.formatted_converted}
                    </p>
                    <p className="text-lg text-muted-foreground mt-2">
                      {conversionResult.formatted_original} ≈ {conversionResult.formatted_converted}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rate: </span>
                        <span className="font-mono">1 {fromCurrency} = {conversionResult.exchange_rate.toFixed(4)} {toCurrency}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">Live rate</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Convert Popular */}
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Popular currencies</p>
                  <div className="flex flex-wrap gap-2">
                    {popularCurrencies.slice(0, 8).map((curr) => (
                      <Button
                        key={curr.code}
                        variant="outline"
                        size="sm"
                        onClick={() => setToCurrency(curr.code)}
                        className={toCurrency === curr.code ? 'border-primary' : ''}
                      >
                        {curr.symbol} {curr.code}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volatility & Stats */}
            <div className="space-y-6">
              {/* Volatility Indicator */}
              {volatility && (
                <Card className="chart-container" data-testid="volatility-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${getVolatilityColor(volatility.volatility_level)}`} />
                      FX Volatility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Volatility</p>
                        <p className={`text-2xl font-bold ${getVolatilityColor(volatility.volatility_level)}`}>
                          {volatility.volatility}%
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{volatility.volatility_level} volatility</p>
                      </div>
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">30-Day Trend</p>
                        <div className="flex items-center gap-2">
                          {volatility.change_percent > 0 ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : volatility.change_percent < 0 ? (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          ) : null}
                          <p className={`text-2xl font-bold ${
                            volatility.change_percent > 0 ? 'text-green-500' : 
                            volatility.change_percent < 0 ? 'text-red-500' : ''
                          }`}>
                            {volatility.change_percent > 0 ? '+' : ''}{volatility.change_percent}%
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{volatility.trend}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">High</p>
                        <p className="font-mono">{volatility.high?.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Low</p>
                        <p className="font-mono">{volatility.low?.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Average</p>
                        <p className="font-mono">{volatility.average?.toFixed(4)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historical Chart */}
              {historicalData.length > 0 && (
                <Card className="chart-container" data-testid="historical-chart">
                  <CardHeader>
                    <CardTitle>30-Day Rate History</CardTitle>
                    <CardDescription>{fromCurrency} to {toCurrency}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(240 5% 65%)"
                            fontSize={10}
                            tickFormatter={(value) => value.slice(5)}
                          />
                          <YAxis 
                            stroke="hsl(240 5% 65%)"
                            fontSize={10}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(240 6% 9%)',
                              border: '1px solid hsl(240 4% 16%)',
                              borderRadius: '8px',
                            }}
                            formatter={(value) => [value.toFixed(4), 'Rate']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Multi-Currency Portfolio</h2>
              <p className="text-muted-foreground">Track assets across multiple currencies</p>
            </div>
            <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-asset-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Portfolio Asset</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAsset} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Asset Name</Label>
                    <Input
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      placeholder="e.g., US Savings Account"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={newAsset.amount}
                        onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={newAsset.currency} 
                        onValueChange={(v) => setNewAsset({ ...newAsset, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {popularCurrencies.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.symbol} {curr.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={newAsset.category} 
                      onValueChange={(v) => setNewAsset({ ...newAsset, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Stocks">Stocks</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                        <SelectItem value="Bonds">Bonds</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddAssetOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Asset</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {portfolio && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Total Value */}
              <Card className="metric-card lg:col-span-1" data-testid="portfolio-total">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <p className="text-3xl font-bold font-mono mt-2">
                    {portfolio.formatted_total}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {portfolio.asset_count} assets across {Object.keys(portfolio.by_currency || {}).length} currencies
                  </p>
                </CardContent>
              </Card>

              {/* Currency Allocation Chart */}
              {allocation && allocation.currency_allocation.length > 0 && (
                <Card className="chart-container lg:col-span-2" data-testid="allocation-chart">
                  <CardHeader>
                    <CardTitle>Currency Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="h-[200px] w-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={allocation.currency_allocation}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="percentage"
                              nameKey="currency"
                            >
                              {allocation.currency_allocation.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {allocation.currency_allocation.map((item, index) => (
                          <div key={item.currency} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span>{item.currency}</span>
                            </div>
                            <span className="font-mono">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Asset List */}
          {portfolio && portfolio.assets && portfolio.assets.length > 0 ? (
            <Card className="chart-container" data-testid="asset-list">
              <CardHeader>
                <CardTitle>Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portfolio.assets.map((asset) => (
                    <div 
                      key={asset.id}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.category} • {asset.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-mono">{asset.formatted_original}</p>
                          <p className="text-sm text-muted-foreground">
                            ≈ {asset.formatted_converted}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="chart-container">
              <CardContent className="py-16">
                <div className="empty-state">
                  <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assets Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first asset to start tracking your multi-currency portfolio
                  </p>
                  <Button onClick={() => setIsAddAssetOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Live Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card className="chart-container" data-testid="live-rates">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Live Exchange Rates
              </CardTitle>
              <CardDescription>
                Base currency: {baseCurrency} • Rates update every hour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {popularCurrencies.filter(c => c.code !== baseCurrency).map((curr) => (
                  <LiveRateCard 
                    key={curr.code}
                    currency={curr}
                    baseCurrency={baseCurrency}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Currency List */}
          <Card className="chart-container">
            <CardHeader>
              <CardTitle>All Supported Currencies ({currencies.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
                {currencies.map((curr) => (
                  <div 
                    key={curr.code}
                    className="p-2 bg-secondary/30 rounded-lg text-sm"
                  >
                    <span className="font-mono">{curr.symbol}</span>
                    <span className="ml-2">{curr.code}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Live Rate Card Component
const LiveRateCard = ({ currency, baseCurrency }) => {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const result = await convertCurrency(1, currency.code, baseCurrency);
        setRate(result);
      } catch (error) {
        console.error(`Error fetching rate for ${currency.code}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchRate();
  }, [currency.code, baseCurrency]);

  if (loading) {
    return (
      <div className="p-4 bg-secondary/30 rounded-lg">
        <div className="skeleton h-4 w-12 mb-2" />
        <div className="skeleton h-6 w-20" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-lg">{currency.symbol}</span>
        <span className="text-sm text-muted-foreground">{currency.code}</span>
      </div>
      {rate && (
        <p className="font-mono text-lg">
          {rate.exchange_rate.toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default CurrencyConverter;
