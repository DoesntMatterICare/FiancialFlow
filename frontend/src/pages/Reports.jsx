import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart
} from "lucide-react";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { getMonthlyReport, getYearlyReport } from "@/lib/api";
import { toast } from "sonner";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i)
}));

export const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport(null);
    
    try {
      let data;
      if (reportType === "monthly") {
        data = await getMonthlyReport(parseInt(selectedYear), parseInt(selectedMonth));
        data.type = "monthly";
      } else {
        data = await getYearlyReport(parseInt(selectedYear));
        data.type = "yearly";
      }
      setReport(data);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
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

  const downloadReport = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${report.type === 'monthly' ? report.month : report.year}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Generate detailed monthly and yearly financial reports
        </p>
      </div>

      {/* Report Generator */}
      <Card className="chart-container" data-testid="report-generator">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
            <TabsList className="tab-list">
              <TabsTrigger value="monthly" className="tab-trigger">
                Monthly Report
              </TabsTrigger>
              <TabsTrigger value="yearly" className="tab-trigger">
                Yearly Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger data-testid="report-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger data-testid="report-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={handleGenerateReport} 
                    disabled={loading}
                    className="w-full"
                    data-testid="generate-report-btn"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="yearly" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger data-testid="report-year-yearly">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={handleGenerateReport} 
                    disabled={loading}
                    className="w-full"
                    data-testid="generate-yearly-report-btn"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Report Display */}
      {report && (
        <div className="space-y-6" data-testid="report-display">
          {/* Report Header */}
          <Card className="chart-container">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {report.type === 'monthly' 
                      ? `${MONTHS.find(m => m.value === String(parseInt(report.month.split('-')[1])))?.label} ${report.month.split('-')[0]}`
                      : `Year ${report.year}`
                    } Report
                  </h2>
                  <p className="text-muted-foreground">
                    {report.type === 'monthly' 
                      ? `${report.transaction_count} transactions`
                      : 'Annual summary'
                    }
                  </p>
                </div>
                <Button variant="outline" onClick={downloadReport} data-testid="download-report-btn">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-xl font-bold font-mono amount-positive">
                      {formatCurrency(report.summary.total_income)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold font-mono amount-negative">
                      {formatCurrency(report.summary.total_expenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.summary.net_savings >= 0 ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                    <PieChart className={`w-5 h-5 ${report.summary.net_savings >= 0 ? 'text-primary' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Savings</p>
                    <p className={`text-xl font-bold font-mono ${report.summary.net_savings >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                      {formatCurrency(report.summary.net_savings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.summary.savings_rate >= 20 ? 'bg-green-500/10' : report.summary.savings_rate >= 10 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                    <TrendingUp className={`w-5 h-5 ${report.summary.savings_rate >= 20 ? 'text-green-500' : report.summary.savings_rate >= 10 ? 'text-yellow-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Savings Rate</p>
                    <p className="text-xl font-bold font-mono">
                      {report.summary.savings_rate?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          {report.category_breakdown && report.category_breakdown.length > 0 && (
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Expense Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.category_breakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 16%)" />
                      <XAxis 
                        type="number" 
                        stroke="hsl(240 5% 65%)"
                        fontSize={12}
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="category" 
                        stroke="hsl(240 5% 65%)"
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(240 6% 9%)',
                          border: '1px solid hsl(240 4% 16%)',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [formatCurrency(value), 'Amount']}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Breakdown (for yearly reports) */}
          {report.monthly_breakdown && report.monthly_breakdown.length > 0 && (
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.monthly_breakdown}>
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
                      <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!report && !loading && (
        <Card className="chart-container" data-testid="no-report">
          <CardContent className="py-16">
            <div className="empty-state">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Generate a Report</h3>
              <p className="text-muted-foreground max-w-md">
                Select a time period and click generate to create a detailed financial report.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
