import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  PieChart,
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
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import { getAnalyticsSummary, getCashFlowForecast, getAnomalies, getBudgetStatus } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/context/CurrencyContext";

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#8b5cf6'];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [cashFlow, setCashFlow] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, cashFlowData, anomaliesData, budgetData] = await Promise.all([
        getAnalyticsSummary(),
        getCashFlowForecast(6),
        getAnomalies(),
        getBudgetStatus()
      ]);
      
      setSummary(summaryData);
      setCashFlow(cashFlowData.forecasts || []);
      setAnomalies(anomaliesData.anomalies || []);
      setBudgetStatus(budgetData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="metric-card">
              <CardContent className="p-6">
                <div className="skeleton h-4 w-24 mb-4" />
                <div className="skeleton h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasData = summary && summary.transaction_count > 0;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Overview</h1>
          <p className="text-muted-foreground">
            {hasData 
              ? `${summary.transaction_count} transactions tracked`
              : "Start by importing your financial data"
            }
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchData}
            data-testid="refresh-dashboard"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {!hasData && (
            <Button 
              size="sm"
              onClick={() => navigate('/import')}
              data-testid="import-data-btn"
            >
              Import Data
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <Card className="metric-card" data-testid="total-income-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold font-mono amount-positive">
                  {formatCurrency(summary?.total_income || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="total-expenses-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold font-mono amount-negative">
                  {formatCurrency(summary?.total_expenses || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="net-balance-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={`text-2xl font-bold font-mono ${(summary?.net_balance || 0) >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                  {formatCurrency(summary?.net_balance || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="anomalies-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold font-mono">
                  {anomalies.length}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${anomalies.length > 0 ? 'bg-yellow-500/10' : 'bg-secondary'}`}>
                <AlertTriangle className={`w-6 h-6 ${anomalies.length > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasData ? (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Chart */}
            <Card className="chart-container lg:col-span-2" data-testid="monthly-trend-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary?.monthly_trend || []}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
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
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#colorIncome)" 
                        name="Income"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expense" 
                        stroke="#ef4444" 
                        fillOpacity={1} 
                        fill="url(#colorExpense)" 
                        name="Expense"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card className="chart-container" data-testid="top-categories-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Top Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={summary?.top_categories || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {(summary?.top_categories || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(240 6% 9%)',
                          border: '1px solid hsl(240 4% 16%)',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [formatCurrency(value), '']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {(summary?.top_categories || []).slice(0, 5).map((cat, index) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{cat.category}</span>
                      </div>
                      <span className="font-mono">{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Forecast & Budget Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Forecast */}
            <Card className="chart-container" data-testid="cash-flow-forecast">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Cash Flow Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cashFlow.length > 0 ? (
                  <div className="space-y-4">
                    {cashFlow.slice(0, 4).map((forecast) => (
                      <div key={forecast.month} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium">{forecast.month}</p>
                          <p className="text-xs text-muted-foreground">
                            Projected: {formatCurrency(forecast.projected_income)} income
                          </p>
                        </div>
                        <div className={`text-right font-mono ${forecast.net_cash_flow >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                          {formatCurrency(forecast.net_cash_flow)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Need more data for forecasting
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Status */}
            <Card className="chart-container" data-testid="budget-status">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Budget Status
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/budget')}
                >
                  Manage
                </Button>
              </CardHeader>
              <CardContent>
                {budgetStatus.length > 0 ? (
                  <div className="space-y-4">
                    {budgetStatus.slice(0, 4).map((budget) => (
                      <div key={budget.budget_id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{budget.category}</span>
                          <span className={`status-badge ${budget.status}`}>
                            {budget.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="budget-progress">
                          <div 
                            className={`budget-progress-bar ${
                              budget.status === 'over' ? 'bg-red-500' :
                              budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(budget.spent)} spent</span>
                          <span>{formatCurrency(budget.limit)} limit</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No budgets set</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/budget')}
                    >
                      Create Budget
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <Card className="chart-container border-yellow-500/30" data-testid="anomalies-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-5 h-5" />
                  Unusual Transactions Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anomalies.slice(0, 5).map((tx) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.date} • {tx.category}
                        </p>
                      </div>
                      <div className={`font-mono font-bold ${tx.type === 'income' ? 'amount-positive' : 'amount-negative'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Empty State */
        <Card className="chart-container" data-testid="empty-state">
          <CardContent className="py-16">
            <div className="empty-state">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Welcome to FinanceFlow</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Import your bank statements, expenses, or business data to get started.
                We support CSV, Excel, and PDF files.
              </p>
              <Button onClick={() => navigate('/import')} data-testid="get-started-btn">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
