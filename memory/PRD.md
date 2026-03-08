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

## Architecture

### Backend (FastAPI + MongoDB)
- **server.py**: Main API with 30+ endpoints
- **MongoDB Collections**: transactions, budgets
- **Key Features**:
  - Rule-based transaction categorization (15+ categories)
  - Z-score anomaly detection algorithm
  - Linear regression cash flow forecasting
  - 2024 federal tax bracket calculations
  - State tax support (10 states)

### Frontend (React + Tailwind + shadcn/ui)
- **7 Pages**: Dashboard, Transactions, Analytics, Budget Planner, Tax Estimator, Reports, Import Data
- **Design System**: Manrope + Inter + JetBrains Mono fonts
- **Charts**: Recharts library for visualizations

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
- [x] Tax estimation (Federal + State)
- [x] Investment suggestions (rule-based)
- [x] Monthly and yearly financial reports
- [x] Dark theme UI

### API Endpoints ✅
- Transactions: GET/POST/PUT/DELETE /api/transactions
- Budgets: GET/POST/PUT/DELETE /api/budgets
- Analytics: /api/analytics/summary, /api/analytics/cash-flow, /api/analytics/anomalies
- Tax: POST /api/tax/estimate, GET /api/tax/estimate-from-transactions
- Reports: GET /api/reports/monthly/{year}/{month}, GET /api/reports/yearly/{year}
- File Upload: POST /api/upload

## User Personas
1. **Small Business Owner**: Needs expense tracking, cash flow forecasting, tax estimation
2. **Freelancer**: Budget management, income tracking, quarterly tax planning
3. **Personal Finance User**: Expense categorization, savings suggestions, anomaly alerts

## Prioritized Backlog

### P0 (Critical) - Done ✅
- Dashboard with financial metrics
- Transaction CRUD
- File import (CSV/Excel/PDF)
- Budget tracking

### P1 (Important) - Future
- Data export to CSV/Excel
- Recurring transaction detection
- Multi-currency support
- Mobile responsive improvements

### P2 (Nice to Have) - Future
- Custom categorization rules
- Email expense import
- Savings goals tracking
- Expense splitting

## Next Tasks
1. Add AI integration when budget allows (OpenAI/Gemini for natural language queries)
2. Implement recurring transaction auto-detection
3. Add data export functionality
4. Enhance PDF parsing with OCR
5. Add custom category creation
