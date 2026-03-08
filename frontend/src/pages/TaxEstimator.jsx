import { useState, useEffect } from "react";
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
  Calculator, 
  DollarSign,
  FileText,
  TrendingUp
} from "lucide-react";
import { estimateTax, estimateTaxFromTransactions } from "@/lib/api";
import { toast } from "sonner";

const FILING_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married Filing Jointly" },
  { value: "head_of_household", label: "Head of Household" },
];

const STATES = [
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "FL", label: "Florida" },
  { value: "WA", label: "Washington" },
  { value: "IL", label: "Illinois" },
  { value: "PA", label: "Pennsylvania" },
  { value: "OH", label: "Ohio" },
  { value: "GA", label: "Georgia" },
  { value: "NC", label: "North Carolina" },
];

export const TaxEstimator = () => {
  const [loading, setLoading] = useState(false);
  const [loadingFromData, setLoadingFromData] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    annual_income: "",
    deductions: "",
    filing_status: "single",
    state: "CA"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        annual_income: parseFloat(formData.annual_income) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        filing_status: formData.filing_status,
        state: formData.state
      };
      
      const response = await estimateTax(data);
      setResult(response);
    } catch (error) {
      console.error("Error estimating tax:", error);
      toast.error("Failed to estimate tax");
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateFromData = async () => {
    setLoadingFromData(true);
    
    try {
      const response = await estimateTaxFromTransactions({
        filing_status: formData.filing_status,
        state: formData.state
      });
      setResult(response);
      setFormData(prev => ({
        ...prev,
        annual_income: response.gross_income.toString(),
        deductions: response.deductions.toString()
      }));
      toast.success("Tax estimated from your transaction data");
    } catch (error) {
      console.error("Error estimating from data:", error);
      toast.error("Failed to estimate from transaction data");
    } finally {
      setLoadingFromData(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tax-estimator-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tax Estimator</h1>
        <p className="text-muted-foreground">
          Calculate your estimated federal and state taxes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="chart-container" data-testid="tax-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Tax Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="annual_income">Annual Income</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="annual_income"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.annual_income}
                    onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                    placeholder="0.00"
                    className="pl-10"
                    required
                    data-testid="tax-income"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deductions">Itemized Deductions (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="deductions"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    placeholder="0.00"
                    className="pl-10"
                    data-testid="tax-deductions"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard deduction will be used if itemized deductions are lower
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filing_status">Filing Status</Label>
                  <Select 
                    value={formData.filing_status} 
                    onValueChange={(value) => setFormData({ ...formData, filing_status: value })}
                  >
                    <SelectTrigger data-testid="tax-filing-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILING_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger data-testid="tax-state">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button type="submit" disabled={loading} data-testid="calculate-tax-btn">
                  {loading ? "Calculating..." : "Calculate Tax"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleEstimateFromData}
                  disabled={loadingFromData}
                  data-testid="estimate-from-data-btn"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {loadingFromData ? "Loading..." : "Estimate from My Data"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="chart-container" data-testid="tax-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tax Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                {/* Income Summary */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Income Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Gross Income</span>
                      <span className="font-mono">{formatCurrency(result.gross_income)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Deductions</span>
                      <span className="font-mono amount-negative">-{formatCurrency(result.deductions)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-medium">Taxable Income</span>
                      <span className="font-mono font-medium">{formatCurrency(result.taxable_income)}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Tax Breakdown
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Federal Tax</span>
                      <span className="font-mono amount-negative">{formatCurrency(result.federal_tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">State Tax</span>
                      <span className="font-mono amount-negative">{formatCurrency(result.state_tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-secondary/30 -mx-4 px-4 rounded-lg">
                      <span className="font-bold">Total Tax</span>
                      <span className="font-mono font-bold amount-negative">{formatCurrency(result.total_tax)}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Rates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Effective Rate</p>
                    <p className="text-2xl font-bold font-mono">{formatPercent(result.effective_rate)}</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Marginal Rate</p>
                    <p className="text-2xl font-bold font-mono">{formatPercent(result.marginal_rate)}</p>
                  </div>
                </div>

                {/* Take Home */}
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Take Home</p>
                      <p className="text-xs text-muted-foreground">(After Federal & State Tax)</p>
                    </div>
                    <p className="text-2xl font-bold font-mono amount-positive">
                      {formatCurrency(result.gross_income - result.total_tax)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Enter your income details to see estimated taxes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax Info */}
      <Card className="bg-card border-border" data-testid="tax-info">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">2024 Tax Brackets (Federal)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">Single</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>10%: $0 - $11,600</li>
                <li>12%: $11,601 - $47,150</li>
                <li>22%: $47,151 - $100,525</li>
                <li>24%: $100,526 - $191,950</li>
                <li>32%: $191,951 - $243,725</li>
                <li>35%: $243,726 - $609,350</li>
                <li>37%: $609,351+</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Married Filing Jointly</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>10%: $0 - $23,200</li>
                <li>12%: $23,201 - $94,300</li>
                <li>22%: $94,301 - $201,050</li>
                <li>24%: $201,051 - $383,900</li>
                <li>32%: $383,901 - $487,450</li>
                <li>35%: $487,451 - $731,200</li>
                <li>37%: $731,201+</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Standard Deductions</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>Single: $14,600</li>
                <li>Married: $29,200</li>
                <li>Head of Household: $21,900</li>
              </ul>
              <p className="mt-4 text-xs">
                *This is an estimate only. Consult a tax professional for accurate tax advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxEstimator;
