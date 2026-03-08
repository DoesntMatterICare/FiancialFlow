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
import { useCurrency } from "@/context/CurrencyContext";

const FILING_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married Filing Jointly" },
];

const COUNTRIES = [
  { value: "US", label: "United States", flag: "🇺🇸" },
  { value: "IN", label: "India", flag: "🇮🇳" },
  { value: "UK", label: "United Kingdom", flag: "🇬🇧" },
];

const STATES_BY_COUNTRY = {
  US: [
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
  ],
  IN: [
    { value: "MH", label: "Maharashtra" },
    { value: "KA", label: "Karnataka" },
    { value: "TN", label: "Tamil Nadu" },
    { value: "DL", label: "Delhi" },
    { value: "TG", label: "Telangana" },
    { value: "AP", label: "Andhra Pradesh" },
    { value: "WB", label: "West Bengal" },
    { value: "GJ", label: "Gujarat" },
  ],
  UK: [
    { value: "EN", label: "England" },
    { value: "SC", label: "Scotland" },
    { value: "WL", label: "Wales" },
    { value: "NI", label: "Northern Ireland" },
  ],
};

export const TaxEstimator = () => {
  const { formatCurrency, getCurrencySymbol, country: defaultCountry } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [loadingFromData, setLoadingFromData] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    annual_income: "",
    deductions: "",
    filing_status: "single",
    state: defaultCountry === "IN" ? "MH" : "CA",
    country: defaultCountry || "US"
  });

  useEffect(() => {
    // Update default state when country changes
    const states = STATES_BY_COUNTRY[formData.country];
    if (states && states.length > 0 && !states.find(s => s.value === formData.state)) {
      setFormData(prev => ({ ...prev, state: states[0].value }));
    }
  }, [formData.country]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        annual_income: parseFloat(formData.annual_income) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        filing_status: formData.filing_status,
        state: formData.state,
        country: formData.country
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
        state: formData.state,
        country: formData.country
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

  const formatResultCurrency = (value) => {
    const currencyOverride = result?.currency || (formData.country === "IN" ? "INR" : formData.country === "UK" ? "GBP" : "USD");
    return formatCurrency(value, { currencyOverride });
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const currentStates = STATES_BY_COUNTRY[formData.country] || STATES_BY_COUNTRY.US;
  const currentCountry = COUNTRIES.find(c => c.value === formData.country);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tax-estimator-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tax Estimator</h1>
        <p className="text-muted-foreground">
          Calculate your estimated taxes for {currentCountry?.label || "your country"}
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
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger data-testid="tax-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_income">
                  Annual Income ({formData.country === "IN" ? "₹" : formData.country === "UK" ? "£" : "$"})
                </Label>
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
                  <Label htmlFor="state">
                    {formData.country === "IN" ? "State" : formData.country === "UK" ? "Region" : "State"}
                  </Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger data-testid="tax-state">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentStates.map((state) => (
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
              Tax Estimate {result && `(${result.currency || 'USD'})`}
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
                      <span className="font-mono">{formatResultCurrency(result.gross_income)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Deductions</span>
                      <span className="font-mono amount-negative">-{formatResultCurrency(result.deductions)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-medium">Taxable Income</span>
                      <span className="font-mono font-medium">{formatResultCurrency(result.taxable_income)}</span>
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
                      <span className="text-muted-foreground">
                        {formData.country === "IN" ? "Income Tax" : formData.country === "UK" ? "Income Tax" : "Federal Tax"}
                      </span>
                      <span className="font-mono amount-negative">{formatResultCurrency(result.federal_tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        {formData.country === "IN" ? "Professional Tax" : formData.country === "UK" ? "NI Adjustment" : "State Tax"}
                      </span>
                      <span className="font-mono amount-negative">{formatResultCurrency(result.state_tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-secondary/30 -mx-4 px-4 rounded-lg">
                      <span className="font-bold">Total Tax</span>
                      <span className="font-mono font-bold amount-negative">{formatResultCurrency(result.total_tax)}</span>
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
                      <p className="text-xs text-muted-foreground">(After All Taxes)</p>
                    </div>
                    <p className="text-2xl font-bold font-mono amount-positive">
                      {formatResultCurrency(result.gross_income - result.total_tax)}
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

      {/* Tax Info by Country */}
      <Card className="bg-card border-border" data-testid="tax-info">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">
            {formData.country === "IN" ? "🇮🇳 India - New Tax Regime FY 2024-25" : 
             formData.country === "UK" ? "🇬🇧 UK - Income Tax 2024-25" : 
             "🇺🇸 2024 Tax Brackets (Federal)"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {formData.country === "IN" ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Income Tax Slabs</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>0%: Up to ₹3,00,000</li>
                    <li>5%: ₹3,00,001 - ₹7,00,000</li>
                    <li>10%: ₹7,00,001 - ₹10,00,000</li>
                    <li>15%: ₹10,00,001 - ₹12,00,000</li>
                    <li>20%: ₹12,00,001 - ₹15,00,000</li>
                    <li>30%: Above ₹15,00,000</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Standard Deduction</h4>
                  <p className="text-muted-foreground">₹75,000 (Salaried)</p>
                  <h4 className="font-medium mt-4 mb-2">Professional Tax</h4>
                  <p className="text-muted-foreground">Max ₹2,500/year (varies by state)</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Note</h4>
                  <p className="text-xs text-muted-foreground">
                    This estimate uses the New Tax Regime rates. Old regime with deductions (80C, 80D, HRA) may provide different results.
                    Consult a CA for accurate tax planning.
                  </p>
                </div>
              </>
            ) : formData.country === "UK" ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Income Tax Bands</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>0%: Up to £12,570 (Personal Allowance)</li>
                    <li>20%: £12,571 - £50,270 (Basic Rate)</li>
                    <li>40%: £50,271 - £125,140 (Higher Rate)</li>
                    <li>45%: Above £125,140 (Additional Rate)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Personal Allowance</h4>
                  <p className="text-muted-foreground">£12,570 (reduced above £100,000)</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Scotland Rates</h4>
                  <p className="text-xs text-muted-foreground">
                    Scotland has different income tax rates. Select Scotland in the region dropdown for Scottish tax calculations.
                  </p>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxEstimator;
