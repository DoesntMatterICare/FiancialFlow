import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Globe,
  DollarSign,
  Check
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY" },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "CNY" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", currency: "CHF" },
];

export const Settings = () => {
  const { currency, setCurrency, country, setCountry, currencies, formatCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);

  const handleCountryChange = async (newCountry) => {
    setSaving(true);
    const countryData = COUNTRIES.find(c => c.code === newCountry);
    await setCountry(newCountry);
    if (countryData) {
      await setCurrency(countryData.currency);
    }
    setSaving(false);
    toast.success(`Settings updated to ${countryData?.name || newCountry}`);
  };

  const handleCurrencyChange = async (newCurrency) => {
    setSaving(true);
    await setCurrency(newCurrency);
    setSaving(false);
    toast.success(`Currency changed to ${newCurrency}`);
  };

  // Sample amounts for preview
  const sampleAmounts = [1000, 50000, 100000, 1000000, 10000000];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your currency and regional preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Region Settings */}
        <Card className="chart-container" data-testid="region-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Region & Country
            </CardTitle>
            <CardDescription>
              Select your country for tax calculations and number formatting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={handleCountryChange} disabled={saving}>
                <SelectTrigger data-testid="country-select">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Selected Region:</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {COUNTRIES.find(c => c.code === country)?.flag || "🌍"}
                </span>
                <div>
                  <p className="font-semibold">
                    {COUNTRIES.find(c => c.code === country)?.name || country}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Default currency: {COUNTRIES.find(c => c.code === country)?.currency || currency}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card className="chart-container" data-testid="currency-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Currency
            </CardTitle>
            <CardDescription>
              Choose your preferred currency for displaying amounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={handleCurrencyChange} disabled={saving}>
                <SelectTrigger data-testid="currency-select">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono w-8">{c.symbol}</span>
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">({c.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">Current Format Preview:</p>
              <div className="grid grid-cols-2 gap-2">
                {sampleAmounts.map((amount) => (
                  <div key={amount} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{amount.toLocaleString()}:</span>
                    <span className="font-mono">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Preview */}
      <Card className="chart-container" data-testid="format-preview">
        <CardHeader>
          <CardTitle>Format Examples</CardTitle>
          <CardDescription>
            See how different amounts will be displayed with your current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Income Example</p>
              <p className="text-2xl font-bold font-mono amount-positive">
                +{formatCurrency(75000)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Monthly salary</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Expense Example</p>
              <p className="text-2xl font-bold font-mono amount-negative">
                -{formatCurrency(15000)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Monthly rent</p>
            </div>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Balance Example</p>
              <p className="text-2xl font-bold font-mono">
                {formatCurrency(250000)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total savings</p>
            </div>
          </div>

          {/* Compact format examples */}
          <div className="mt-6">
            <p className="text-sm font-medium mb-3">Compact Format (for charts):</p>
            <div className="flex flex-wrap gap-4">
              <div className="px-3 py-2 bg-secondary rounded-lg">
                <span className="text-muted-foreground text-sm">1L = </span>
                <span className="font-mono">{formatCurrency(100000, { compact: true })}</span>
              </div>
              <div className="px-3 py-2 bg-secondary rounded-lg">
                <span className="text-muted-foreground text-sm">10L = </span>
                <span className="font-mono">{formatCurrency(1000000, { compact: true })}</span>
              </div>
              <div className="px-3 py-2 bg-secondary rounded-lg">
                <span className="text-muted-foreground text-sm">1Cr = </span>
                <span className="font-mono">{formatCurrency(10000000, { compact: true })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Info */}
      <Card className="bg-card border-border" data-testid="tax-info">
        <CardHeader>
          <CardTitle>Tax Calculation Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {country === "IN" && (
              <div>
                <h4 className="font-medium mb-2">🇮🇳 India - New Tax Regime FY 2024-25</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>0%: Up to ₹3,00,000</li>
                  <li>5%: ₹3,00,001 - ₹7,00,000</li>
                  <li>10%: ₹7,00,001 - ₹10,00,000</li>
                  <li>15%: ₹10,00,001 - ₹12,00,000</li>
                  <li>20%: ₹12,00,001 - ₹15,00,000</li>
                  <li>30%: Above ₹15,00,000</li>
                </ul>
                <p className="mt-2 text-xs">Standard Deduction: ₹75,000</p>
              </div>
            )}
            {country === "US" && (
              <div>
                <h4 className="font-medium mb-2">🇺🇸 USA - Federal Tax 2024</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>10%: $0 - $11,600</li>
                  <li>12%: $11,601 - $47,150</li>
                  <li>22%: $47,151 - $100,525</li>
                  <li>24%: $100,526 - $191,950</li>
                  <li>32%: $191,951 - $243,725</li>
                  <li>35%: $243,726 - $609,350</li>
                  <li>37%: $609,351+</li>
                </ul>
                <p className="mt-2 text-xs">Standard Deduction: $14,600 (Single)</p>
              </div>
            )}
            {country === "UK" && (
              <div>
                <h4 className="font-medium mb-2">🇬🇧 UK - Income Tax 2024-25</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>0%: Up to £12,570 (Personal Allowance)</li>
                  <li>20%: £12,571 - £50,270 (Basic Rate)</li>
                  <li>40%: £50,271 - £125,140 (Higher Rate)</li>
                  <li>45%: Above £125,140 (Additional Rate)</li>
                </ul>
              </div>
            )}
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">Settings Auto-Saved</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Your preferences are automatically saved and will persist across sessions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
