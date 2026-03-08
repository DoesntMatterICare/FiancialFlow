import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  BarChart3, 
  Wallet, 
  Calculator, 
  FileText, 
  Upload,
  TrendingUp,
  Settings,
  Globe
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/converter", icon: Globe, label: "Currency" },
  { path: "/budget", icon: Wallet, label: "Budget" },
  { path: "/tax", icon: Calculator, label: "Tax Estimator" },
  { path: "/reports", icon: FileText, label: "Reports" },
  { path: "/import", icon: Upload, label: "Import Data" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export const Layout = () => {
  const location = useLocation();
  const { currency, getCurrencySymbol } = useCurrency();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sidebar" data-testid="sidebar">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-foreground">FinanceFlow</h1>
              <p className="text-xs text-muted-foreground">Smart Finance Tool</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1" data-testid="navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center hidden lg:block">
            <span className="font-mono">{getCurrencySymbol()}</span> {currency}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="app-header" data-testid="header">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {navItems.find(item => 
                item.path === "/" 
                  ? location.pathname === "/" 
                  : location.pathname.startsWith(item.path)
              )?.label || "FinanceFlow"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
