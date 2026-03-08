import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Wallet, 
  Trash2,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { 
  getBudgets, 
  getBudgetStatus, 
  createBudget, 
  deleteBudget,
  getCategories 
} from "@/lib/api";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

export const BudgetPlanner = () => {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [budgets, setBudgets] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    period: "monthly",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsData, statusData, catData] = await Promise.all([
        getBudgets(),
        getBudgetStatus(),
        getCategories()
      ]);
      setBudgets(budgetsData);
      setBudgetStatus(statusData);
      setCategories(catData.categories || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createBudget({
        ...formData,
        limit: parseFloat(formData.limit)
      });
      
      toast.success("Budget created");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating budget:", error);
      toast.error("Failed to create budget");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);
      toast.success("Budget deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      limit: "",
      period: "monthly",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'over':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const usedCategories = budgets.map(b => b.category);
  const availableCategories = categories.filter(c => !usedCategories.includes(c));

  // Calculate totals
  const totalBudget = budgetStatus.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetStatus.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgetStatus.filter(b => b.status === 'over').length;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="budget-planner-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budget Planner</h1>
          <p className="text-muted-foreground">
            Set and track spending limits by category
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button 
              disabled={availableCategories.length === 0}
              data-testid="add-budget-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" data-testid="budget-dialog">
            <DialogHeader>
              <DialogTitle>Create Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger data-testid="budget-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limit">Budget Limit ({getCurrencySymbol()})</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  placeholder="0.00"
                  required
                  data-testid="budget-limit"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                >
                  <SelectTrigger data-testid="budget-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    data-testid="budget-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    data-testid="budget-end-date"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="save-budget-btn">
                  Create Budget
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="metric-card" data-testid="total-budget-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold font-mono">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="total-spent-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className={`text-2xl font-bold font-mono ${totalSpent > totalBudget ? 'amount-negative' : 'text-foreground'}`}>
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalSpent > totalBudget ? 'bg-red-500/10' : 'bg-secondary'}`}>
                {totalSpent > totalBudget ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="over-budget-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Over Budget</p>
                <p className="text-2xl font-bold font-mono">
                  {overBudgetCount} categories
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overBudgetCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {overBudgetCount > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="skeleton h-6 w-32 mb-4" />
                <div className="skeleton h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgetStatus.length > 0 ? (
        <div className="space-y-4" data-testid="budget-list">
          {budgetStatus.map((budget) => (
            <Card 
              key={budget.budget_id} 
              className={`bg-card border-border ${budget.status === 'over' ? 'border-red-500/30' : ''}`}
              data-testid={`budget-card-${budget.budget_id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(budget.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{budget.category}</h3>
                      <p className="text-sm text-muted-foreground">
                        {budget.period} budget
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-badge ${budget.status}`}>
                      {budget.percentage.toFixed(0)}% used
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(budget.budget_id)}
                      className="text-muted-foreground hover:text-red-500"
                      data-testid={`delete-budget-${budget.budget_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="budget-progress h-3">
                    <div 
                      className={`budget-progress-bar ${
                        budget.status === 'over' ? 'bg-red-500' :
                        budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Spent: <span className="font-mono text-foreground">{formatCurrency(budget.spent)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Limit: <span className="font-mono text-foreground">{formatCurrency(budget.limit)}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-mono ${budget.remaining >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                      {budget.remaining >= 0 ? 'Remaining: ' : 'Over by: '}
                      {formatCurrency(Math.abs(budget.remaining))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="chart-container" data-testid="no-budgets">
          <CardContent className="py-16">
            <div className="empty-state">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Budgets Set</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Create budgets to track your spending by category and stay on top of your finances.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="create-first-budget">
                Create Your First Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetPlanner;
