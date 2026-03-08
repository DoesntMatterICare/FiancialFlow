# FinanceFlow - PRD (Product Requirements Document)

## Original Problem Statement
An automated finance tool that works like Microsoft Excel but with built-in AI and financial add-ons:
- Upload bank statements, expenses, or business numbers
- Categorize financial data automatically
- Predict cash flow
- Suggest investments or savings
- Detect unusual spending patterns
- Automate spreadsheet work with natural language queries
- Financial dashboards, Tax estimates, Budget planning

## User Choices
1. **AI Integration**: None (budget constraints) - using algorithmic/rule-based methods
2. **File Formats**: CSV, Excel (.xlsx), PDF (basic text extraction)
3. **Features**: All - Cash flow prediction, expense categorization, anomaly detection, tax estimation, budget planning, investment suggestions
4. **Theme**: Dark theme (professional finance look)
5. **Authentication**: No authentication needed (single user)
6. **Currency**: Global support with focus on Indian Rupee (INR)

## Architecture

### Backend (FastAPI + MongoDB)
- **server.py**: Main API with 35+ endpoints
- **MongoDB Collections**: transactions, budgets, settings
- **Key Features**:
  - Rule-based transaction categorization (15+ categories)
  - Z-score anomaly detection algorithm
  - Linear regression cash flow forecasting
  - Multi-country tax calculations (US, India, UK)
  - 10 supported currencies with locale formatting

### Frontend (React + Tailwind + shadcn/ui)
- **8 Pages**: Dashboard, Transactions, Analytics, Budget Planner, Tax Estimator, Reports, Import Data, Settings
- **Design System**: Manrope + Inter + JetBrains Mono fonts
- **Charts**: Recharts library for visualizations
- **Currency Context**: Global state for currency preferences

## What's Been Implemented (March 8, 2026)

### Core Features ✅
- [x] Dashboard with financial overview and KPI cards
- [x] Transaction management (CRUD operations)
- [x] File upload support (CSV, Excel, PDF)
- [x] Automatic transaction categorization
- [x] Anomaly detection with z-score algorithm
- [x] Cash flow forecasting (6-month projection)
- [x] Budget creation and tracking
- [x] Budget vs actual spending comparison
- [x] Multi-country tax estimation (US, India, UK)
- [x] Investment suggestions (rule-based)
- [x] Monthly and yearly financial reports
- [x] Dark theme UI
- [x] **Multi-currency support (10 currencies including INR)**
- [x] **Indian number formatting (Lakhs, Crores)**
- [x] **Settings page for country/currency configuration**

### Supported Currencies
USD ($), INR (₹), EUR (€), GBP (£), JPY (¥), AUD (A$), CAD (C$), CHF, CNY (¥), SGD (S$)

### Tax Support by Country
- **India**: New Tax Regime FY 2024-25 (slabs from 0% to 30%), Professional Tax by state
- **USA**: 2024 Federal Tax Brackets, State tax rates for 10 states
- **UK**: Income Tax 2024-25 (Personal Allowance to Additional Rate)

### API Endpoints ✅
- Transactions: GET/POST/PUT/DELETE /api/transactions
- Budgets: GET/POST/PUT/DELETE /api/budgets
- Analytics: /api/analytics/summary, /api/analytics/cash-flow, /api/analytics/anomalies
- Tax: POST /api/tax/estimate (with country parameter)
- Reports: GET /api/reports/monthly/{year}/{month}, GET /api/reports/yearly/{year}
- Settings: GET/PUT /api/settings
- Currencies: GET /api/currencies, GET /api/countries
- File Upload: POST /api/upload

## User Personas
1. **Indian Professional**: Salary tracking in INR, new tax regime calculations, professional tax
2. **Small Business Owner**: Multi-currency expense tracking, cash flow forecasting
3. **Freelancer**: Budget management, income tracking, quarterly tax planning
4. **Personal Finance User**: Expense categorization, savings suggestions, anomaly alerts

## Prioritized Backlog

### P0 (Critical) - Done ✅
- Dashboard with financial metrics
- Transaction CRUD
- File import (CSV/Excel/PDF)
- Budget tracking
- Multi-currency support

### P1 (Important) - Future
- Data export to CSV/Excel
- Recurring transaction detection
- Old Tax Regime support for India (with 80C, 80D deductions)
- GST calculations

### P2 (Nice to Have) - Future
- Custom categorization rules
- Email expense import
- Savings goals tracking
- Expense splitting
- Currency conversion rates (live API)

## Next Tasks
1. Add AI integration when budget allows (OpenAI/Gemini for natural language queries)
2. Implement Old Tax Regime for India with deduction tracking
3. Add data export functionality
4. Enhance PDF parsing with OCR
5. Add GST calculation support for Indian businesses
