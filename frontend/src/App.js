import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Analytics from "@/pages/Analytics";
import BudgetPlanner from "@/pages/BudgetPlanner";
import TaxEstimator from "@/pages/TaxEstimator";
import Reports from "@/pages/Reports";
import ImportData from "@/pages/ImportData";
import "@/App.css";

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'hsl(240 6% 9%)',
            border: '1px solid hsl(240 4% 16%)',
            color: 'hsl(0 0% 98%)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="budget" element={<BudgetPlanner />} />
          <Route path="tax" element={<TaxEstimator />} />
          <Route path="reports" element={<Reports />} />
          <Route path="import" element={<ImportData />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
