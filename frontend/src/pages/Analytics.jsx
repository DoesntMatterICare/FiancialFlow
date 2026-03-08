import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  PieChart,
  Target,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  getAnalyticsSummary, 
  getCashFlowForecast, 
  getAnomalies, 
  getCategoryBreakdown,
  getInvestmentSuggestions 
} from "@/lib/api";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Analytics = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [cashFlow, setCashFlow] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, cashFlowData, anomaliesData, categoriesData, suggestionsData] = await Promise.all([
        getAnalyticsSummary(),
        getCashFlowForecast(6),
        getAnomalies(),
        getCategoryBreakdown(),
        getInvestmentSuggestions(10000)
      ]);
      
      setSummary(summaryData);
      setCashFlow(cashFlowData.forecasts || []);
      setAnomalies(anomaliesData.anomalies || []);
      setCategoryBreakdown(categoriesData.breakdown || []);
      setSuggestions(suggestionsData.suggestions || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" data-testid="analytics-loading">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-[400px] rounded-xl" />
          <div className="skeleton h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  const hasData = summary && summary.transaction_count > 0;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your financial data
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} data-testid="refresh-analytics">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {hasData ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="tab-list" data-testid="analytics-tabs">
            <TabsTrigger value="overview" className="tab-trigger">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="forecast" className="tab-trigger">
              <TrendingUp className="w-4 h-4 mr-2" />
              Cash Flow
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="tab-trigger">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Anomalies
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="tab-trigger">
              <Lightbulb className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Income vs Expense */}
              <Card className="chart-container" data-testid="income-expense-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Income vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary?.monthly_trend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                        <XAxis 
                          dataKey="month" 
                          stroke="hsl(240 5% 65%)"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(240 5% 65%)"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => formatCurrency(value, { compact: true })}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(240 6% 9%)',
                            border: '1px solid hsl(240 4% 16%)',
                            borderRadius: '8px',
                          }}
                          formatter={(value) => [formatCurrency(value), '']}
                        />
                        <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="chart-container" data-testid="category-breakdown-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Expense Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryBreakdown.slice(0, 7)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="amount"
                          nameKey="category"
                        >
                          {categoryBreakdown.slice(0, 7).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(240 6% 9%)',
                            border: '1px solid hsl(240 4% 16%)',
                            borderRadius: '8px',
                          }}
                          formatter={(value, name) => [formatCurrency(value), name]}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {categoryBreakdown.slice(0, 6).map((cat, index) => (
                      <div key={cat.category} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground truncate">{cat.category}</span>
                        <span className="ml-auto font-mono text-xs">{cat.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Net Savings Trend */}
            <Card className="chart-container" data-testid="net-savings-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Net Savings Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary?.monthly_trend || []}>
                      <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(240 5% 65%)"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(240 5% 65%)"
                        fontSize={12}
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(240 6% 9%)',
                          border: '1px solid hsl(240 4% 16%)',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [formatCurrency(value), 'Net']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="net" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorNet)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <Card className="chart-container" data-testid="cash-flow-forecast-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  6-Month Cash Flow Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cashFlow.length > 0 ? (
                  <>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cashFlow}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                          <XAxis 
                            dataKey="month" 
                            stroke="hsl(240 5% 65%)"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="hsl(240 5% 65%)"
                            fontSize={12}
                            tickFormatter={(value) => `$${value / 1000}k`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(240 6% 9%)',
                              border: '1px solid hsl(240 4% 16%)',
                              borderRadius: '8px',
                            }}
                            formatter={(value) => [formatCurrency(value), '']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="projected_income" 
                            stroke="#22c55e" 
                            strokeWidth={2}
                            dot={{ fill: '#22c55e', strokeWidth: 2 }}
                            name="Projected Income"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="projected_expense" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', strokeWidth: 2 }}
                            name="Projected Expense"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="net_cash_flow" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                            name="Net Cash Flow"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {cashFlow.slice(0, 3).map((forecast) => (
                        <Card key={forecast.month} className="bg-secondary/30 border-border">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">{forecast.month}</p>
                            <p className={`text-xl font-bold font-mono ${forecast.net_cash_flow >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                              {formatCurrency(forecast.net_cash_flow)}
                            </p>
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                              <span>In: {formatCurrency(forecast.projected_income)}</span>
                              <span>Out: {formatCurrency(forecast.projected_expense)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Need more historical data for forecasting
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-6">
            <Card className="chart-container" data-testid="anomalies-list">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Unusual Transactions ({anomalies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {anomalies.length > 0 ? (
                  <div className="space-y-3">
                    {anomalies.map((tx) => (
                      <div 
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {tx.date} • {tx.category}
                            </p>
                          </div>
                        </div>
                        <div className={`text-right font-mono font-bold ${tx.type === 'income' ? 'amount-positive' : 'amount-negative'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-muted-foreground">No anomalies detected</p>
                    <p className="text-sm text-muted-foreground">Your spending patterns look normal</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investment Insights Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card className="chart-container" data-testid="investment-suggestions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Investment Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-4 bg-secondary/30 border border-border rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{suggestion.type}</h4>
                            <span className={`status-badge ${
                              suggestion.priority === 'High' ? 'over' : 
                              suggestion.priority === 'Medium' ? 'warning' : 'good'
                            }`}>
                              {suggestion.priority} Priority
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        {suggestion.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{suggestion.progress.toFixed(0)}%</span>
                            </div>
                            <div className="budget-progress">
                              <div 
                                className="budget-progress-bar bg-primary"
                                style={{ width: `${Math.min(suggestion.progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {suggestion.recommended_monthly && (
                          <p className="text-sm mt-2">
                            Recommended monthly: <span className="font-mono text-primary">{formatCurrency(suggestion.recommended_monthly)}</span>
                          </p>
                        )}
                        {suggestion.potential_annual_return && (
                          <p className="text-sm mt-2">
                            Potential annual return: <span className="font-mono amount-positive">{formatCurrency(suggestion.potential_annual_return)}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Add more financial data to get personalized suggestions
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="chart-container" data-testid="no-data">
          <CardContent className="py-16">
            <div className="empty-state">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Data Available</h3>
              <p className="text-muted-foreground max-w-md">
                Import your financial data to see analytics and insights.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
