from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import io
import csv
import json
from enum import Enum
import httpx
import asyncio

# File parsing imports
import openpyxl
import PyPDF2
import pandas as pd
import numpy as np

# ============== EXCHANGE RATE CONFIG ==============
EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest"
EXCHANGE_RATE_CACHE_TTL = 3600  # 1 hour in seconds
FALLBACK_RATES_FILE = Path(__file__).parent / "fallback_rates.json"

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== ENUMS ==============
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

class Currency(str, Enum):
    USD = "USD"
    INR = "INR"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    AUD = "AUD"
    CAD = "CAD"
    CHF = "CHF"
    CNY = "CNY"
    SGD = "SGD"

class Category(str, Enum):
    SALARY = "Salary"
    FREELANCE = "Freelance"
    INVESTMENT = "Investment"
    RENT = "Rent"
    UTILITIES = "Utilities"
    GROCERIES = "Groceries"
    DINING = "Dining"
    TRANSPORT = "Transport"
    ENTERTAINMENT = "Entertainment"
    HEALTHCARE = "Healthcare"
    SHOPPING = "Shopping"
    SUBSCRIPTIONS = "Subscriptions"
    INSURANCE = "Insurance"
    TAXES = "Taxes"
    OTHER = "Other"

# ============== MODELS ==============
class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    description: str
    amount: float
    type: TransactionType
    category: str = "Other"
    tags: List[str] = []
    is_anomaly: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TransactionCreate(BaseModel):
    date: str
    description: str
    amount: float
    type: TransactionType
    category: str = "Other"
    tags: List[str] = []

class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[TransactionType] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    limit: float
    period: str = "monthly"  # monthly, weekly, yearly
    start_date: str
    end_date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BudgetCreate(BaseModel):
    category: str
    limit: float
    period: str = "monthly"
    start_date: str
    end_date: str

class TaxEstimateRequest(BaseModel):
    annual_income: float
    deductions: float = 0
    filing_status: str = "single"  # single, married, head_of_household
    state: str = "CA"
    country: str = "US"  # US, IN (India), UK, etc.

class TaxEstimateResponse(BaseModel):
    gross_income: float
    deductions: float
    taxable_income: float
    federal_tax: float
    state_tax: float
    total_tax: float
    effective_rate: float
    marginal_rate: float
    currency: str = "USD"

class UserSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    currency: str = "USD"
    country: str = "US"
    locale: str = "en-US"
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserSettingsUpdate(BaseModel):
    currency: Optional[str] = None
    country: Optional[str] = None
    locale: Optional[str] = None

# ============== CATEGORY RULES ==============
CATEGORY_RULES = {
    "salary": Category.SALARY,
    "payroll": Category.SALARY,
    "wage": Category.SALARY,
    "freelance": Category.FREELANCE,
    "contract": Category.FREELANCE,
    "consulting": Category.FREELANCE,
    "dividend": Category.INVESTMENT,
    "interest": Category.INVESTMENT,
    "investment": Category.INVESTMENT,
    "rent": Category.RENT,
    "mortgage": Category.RENT,
    "lease": Category.RENT,
    "electric": Category.UTILITIES,
    "gas": Category.UTILITIES,
    "water": Category.UTILITIES,
    "internet": Category.UTILITIES,
    "phone": Category.UTILITIES,
    "grocery": Category.GROCERIES,
    "supermarket": Category.GROCERIES,
    "walmart": Category.GROCERIES,
    "costco": Category.GROCERIES,
    "restaurant": Category.DINING,
    "cafe": Category.DINING,
    "coffee": Category.DINING,
    "uber eats": Category.DINING,
    "doordash": Category.DINING,
    "uber": Category.TRANSPORT,
    "lyft": Category.TRANSPORT,
    "gas station": Category.TRANSPORT,
    "fuel": Category.TRANSPORT,
    "parking": Category.TRANSPORT,
    "netflix": Category.ENTERTAINMENT,
    "spotify": Category.ENTERTAINMENT,
    "movie": Category.ENTERTAINMENT,
    "concert": Category.ENTERTAINMENT,
    "doctor": Category.HEALTHCARE,
    "pharmacy": Category.HEALTHCARE,
    "hospital": Category.HEALTHCARE,
    "medical": Category.HEALTHCARE,
    "amazon": Category.SHOPPING,
    "ebay": Category.SHOPPING,
    "target": Category.SHOPPING,
    "subscription": Category.SUBSCRIPTIONS,
    "membership": Category.SUBSCRIPTIONS,
    "insurance": Category.INSURANCE,
    "premium": Category.INSURANCE,
    "tax": Category.TAXES,
    "irs": Category.TAXES,
}

# ============== HELPER FUNCTIONS ==============
def categorize_transaction(description: str) -> str:
    """Rule-based categorization of transactions"""
    desc_lower = description.lower()
    for keyword, category in CATEGORY_RULES.items():
        if keyword in desc_lower:
            return category.value
    return Category.OTHER.value

def detect_anomalies(transactions: List[dict], threshold: float = 2.0) -> List[str]:
    """Detect anomalies using z-score method"""
    if len(transactions) < 3:
        return []
    
    amounts = [abs(t['amount']) for t in transactions]
    mean_amount = np.mean(amounts)
    std_amount = np.std(amounts)
    
    if std_amount == 0:
        return []
    
    anomaly_ids = []
    for t in transactions:
        z_score = abs((abs(t['amount']) - mean_amount) / std_amount)
        if z_score > threshold:
            anomaly_ids.append(t['id'])
    
    return anomaly_ids

def calculate_federal_tax(taxable_income: float, filing_status: str, country: str = "US") -> tuple:
    """Calculate federal/central tax based on country"""
    
    if country == "IN":
        # India Tax Slabs FY 2024-25 (New Tax Regime)
        brackets = {
            "single": [
                (300000, 0.0),      # Up to 3 lakh - nil
                (700000, 0.05),     # 3-7 lakh - 5%
                (1000000, 0.10),    # 7-10 lakh - 10%
                (1200000, 0.15),    # 10-12 lakh - 15%
                (1500000, 0.20),    # 12-15 lakh - 20%
                (float('inf'), 0.30) # Above 15 lakh - 30%
            ],
            "married": [
                (300000, 0.0),
                (700000, 0.05),
                (1000000, 0.10),
                (1200000, 0.15),
                (1500000, 0.20),
                (float('inf'), 0.30)
            ]
        }
    elif country == "UK":
        # UK Tax Bands 2024-25
        brackets = {
            "single": [
                (12570, 0.0),       # Personal Allowance
                (50270, 0.20),      # Basic rate
                (125140, 0.40),     # Higher rate
                (float('inf'), 0.45) # Additional rate
            ],
            "married": [
                (12570, 0.0),
                (50270, 0.20),
                (125140, 0.40),
                (float('inf'), 0.45)
            ]
        }
    else:  # US (default)
        brackets = {
            "single": [
                (11600, 0.10),
                (47150, 0.12),
                (100525, 0.22),
                (191950, 0.24),
                (243725, 0.32),
                (609350, 0.35),
                (float('inf'), 0.37)
            ],
            "married": [
                (23200, 0.10),
                (94300, 0.12),
                (201050, 0.22),
                (383900, 0.24),
                (487450, 0.32),
                (731200, 0.35),
                (float('inf'), 0.37)
            ],
            "head_of_household": [
                (16550, 0.10),
                (63100, 0.12),
                (100500, 0.22),
                (191950, 0.24),
                (243700, 0.32),
                (609350, 0.35),
                (float('inf'), 0.37)
            ]
        }
    
    tax_brackets = brackets.get(filing_status, brackets.get("single", brackets[list(brackets.keys())[0]]))
    tax = 0
    prev_bracket = 0
    marginal_rate = tax_brackets[0][1] if tax_brackets else 0.10
    
    for bracket, rate in tax_brackets:
        if taxable_income <= bracket:
            tax += (taxable_income - prev_bracket) * rate
            marginal_rate = rate
            break
        else:
            tax += (bracket - prev_bracket) * rate
            prev_bracket = bracket
            marginal_rate = rate
    
    return tax, marginal_rate

def calculate_state_tax(taxable_income: float, state: str, country: str = "US") -> float:
    """Calculate state/regional tax based on country"""
    
    if country == "IN":
        # India doesn't have state income tax (GST is separate)
        # But some states have professional tax (max ₹2500/year)
        state_rates = {
            "MH": 2500,  # Maharashtra
            "KA": 2400,  # Karnataka
            "TN": 2500,  # Tamil Nadu
            "AP": 2500,  # Andhra Pradesh
            "TG": 2500,  # Telangana
            "WB": 2500,  # West Bengal
            "GJ": 2500,  # Gujarat
            "DL": 0,     # Delhi (no professional tax)
        }
        return state_rates.get(state.upper(), 0)
    
    elif country == "UK":
        # UK doesn't have regional income tax (Scotland has different rates)
        if state.upper() == "SC":  # Scotland
            return taxable_income * 0.01  # Simplified Scottish rate difference
        return 0
    
    else:  # US
        state_rates = {
            "CA": 0.0725,
            "NY": 0.0685,
            "TX": 0.0,
            "FL": 0.0,
            "WA": 0.0,
            "IL": 0.0495,
            "PA": 0.0307,
            "OH": 0.04,
            "GA": 0.055,
            "NC": 0.0525,
        }
        rate = state_rates.get(state.upper(), 0.05)
        return taxable_income * rate

def forecast_cash_flow(transactions: List[dict], months_ahead: int = 6) -> List[dict]:
    """Simple linear regression based cash flow forecast"""
    if len(transactions) < 3:
        return []
    
    # Group by month
    monthly_data = {}
    for t in transactions:
        try:
            date = datetime.fromisoformat(t['date'].replace('Z', '+00:00'))
        except:
            try:
                date = datetime.strptime(t['date'], '%Y-%m-%d')
            except:
                continue
        
        month_key = date.strftime('%Y-%m')
        if month_key not in monthly_data:
            monthly_data[month_key] = {'income': 0, 'expense': 0}
        
        if t['type'] == 'income':
            monthly_data[month_key]['income'] += t['amount']
        else:
            monthly_data[month_key]['expense'] += abs(t['amount'])
    
    if len(monthly_data) < 2:
        return []
    
    # Sort by month
    sorted_months = sorted(monthly_data.keys())
    
    # Calculate net flow for each month
    net_flows = []
    for month in sorted_months:
        net = monthly_data[month]['income'] - monthly_data[month]['expense']
        net_flows.append(net)
    
    # Simple moving average for forecast
    avg_income = np.mean([monthly_data[m]['income'] for m in sorted_months])
    avg_expense = np.mean([monthly_data[m]['expense'] for m in sorted_months])
    
    # Linear trend
    x = np.arange(len(net_flows))
    if len(x) > 1:
        slope = (net_flows[-1] - net_flows[0]) / len(net_flows)
    else:
        slope = 0
    
    forecasts = []
    last_date = datetime.strptime(sorted_months[-1], '%Y-%m')
    
    for i in range(1, months_ahead + 1):
        forecast_date = last_date + timedelta(days=30 * i)
        projected_income = avg_income * (1 + 0.02 * i)  # 2% growth assumption
        projected_expense = avg_expense * (1 + 0.01 * i)  # 1% growth assumption
        net_forecast = projected_income - projected_expense + slope * i
        
        forecasts.append({
            'month': forecast_date.strftime('%Y-%m'),
            'projected_income': round(projected_income, 2),
            'projected_expense': round(projected_expense, 2),
            'net_cash_flow': round(net_forecast, 2),
            'cumulative': round(sum([f['net_cash_flow'] for f in forecasts]) + net_forecast, 2)
        })
    
    return forecasts

def get_investment_suggestions(transactions: List[dict], current_savings: float) -> List[dict]:
    """Rule-based investment suggestions"""
    suggestions = []
    
    # Calculate monthly averages
    monthly_income = 0
    monthly_expense = 0
    
    if transactions:
        income_txns = [t for t in transactions if t['type'] == 'income']
        expense_txns = [t for t in transactions if t['type'] == 'expense']
        
        if income_txns:
            monthly_income = sum(t['amount'] for t in income_txns) / max(1, len(set(t['date'][:7] for t in income_txns)))
        if expense_txns:
            monthly_expense = sum(abs(t['amount']) for t in expense_txns) / max(1, len(set(t['date'][:7] for t in expense_txns)))
    
    savings_rate = (monthly_income - monthly_expense) / monthly_income if monthly_income > 0 else 0
    
    # Emergency fund suggestion
    emergency_fund_target = monthly_expense * 6
    if current_savings < emergency_fund_target:
        suggestions.append({
            'type': 'Emergency Fund',
            'priority': 'High',
            'description': f'Build emergency fund to ${emergency_fund_target:,.2f} (6 months expenses)',
            'current': current_savings,
            'target': emergency_fund_target,
            'progress': (current_savings / emergency_fund_target * 100) if emergency_fund_target > 0 else 0
        })
    
    # Retirement savings
    if savings_rate > 0.10:
        suggestions.append({
            'type': '401(k)/IRA',
            'priority': 'Medium',
            'description': 'Consider maximizing retirement contributions',
            'recommended_monthly': round(monthly_income * 0.15, 2)
        })
    
    # Index fund investment
    if current_savings > emergency_fund_target:
        excess = current_savings - emergency_fund_target
        suggestions.append({
            'type': 'Index Funds',
            'priority': 'Medium',
            'description': f'Consider investing ${excess:,.2f} in low-cost index funds',
            'potential_annual_return': round(excess * 0.07, 2)  # 7% average return
        })
    
    # High-yield savings
    if savings_rate < 0.20:
        suggestions.append({
            'type': 'High-Yield Savings',
            'priority': 'Low',
            'description': 'Move idle cash to high-yield savings account (4-5% APY)',
            'potential_monthly_interest': round(current_savings * 0.045 / 12, 2)
        })
    
    return suggestions

# ============== FILE PARSING ==============
async def parse_csv_file(content: bytes) -> List[dict]:
    """Parse CSV file and return transactions"""
    transactions = []
    try:
        decoded = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        
        for row in reader:
            # Try to identify columns
            date = row.get('date') or row.get('Date') or row.get('DATE') or row.get('Transaction Date') or ''
            description = row.get('description') or row.get('Description') or row.get('DESCRIPTION') or row.get('Memo') or ''
            amount_str = row.get('amount') or row.get('Amount') or row.get('AMOUNT') or '0'
            
            # Clean amount
            amount_str = amount_str.replace('$', '').replace(',', '').strip()
            try:
                amount = float(amount_str)
            except:
                amount = 0
            
            # Determine type
            tx_type = TransactionType.EXPENSE if amount < 0 else TransactionType.INCOME
            
            # Auto-categorize
            category = categorize_transaction(description)
            
            if date and description:
                transactions.append({
                    'id': str(uuid.uuid4()),
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': tx_type.value,
                    'category': category,
                    'tags': [],
                    'is_anomaly': False,
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
    except Exception as e:
        logger.error(f"Error parsing CSV: {e}")
    
    return transactions

async def parse_excel_file(content: bytes) -> List[dict]:
    """Parse Excel file and return transactions"""
    transactions = []
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(content))
        sheet = workbook.active
        
        # Get headers from first row
        headers = [cell.value.lower() if cell.value else '' for cell in sheet[1]]
        
        # Find column indices
        date_idx = next((i for i, h in enumerate(headers) if 'date' in h), 0)
        desc_idx = next((i for i, h in enumerate(headers) if 'desc' in h or 'memo' in h), 1)
        amount_idx = next((i for i, h in enumerate(headers) if 'amount' in h), 2)
        
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not row[date_idx]:
                continue
            
            date = str(row[date_idx])
            if hasattr(row[date_idx], 'strftime'):
                date = row[date_idx].strftime('%Y-%m-%d')
            
            description = str(row[desc_idx]) if row[desc_idx] else ''
            
            try:
                amount = float(row[amount_idx]) if row[amount_idx] else 0
            except:
                amount = 0
            
            tx_type = TransactionType.EXPENSE if amount < 0 else TransactionType.INCOME
            category = categorize_transaction(description)
            
            transactions.append({
                'id': str(uuid.uuid4()),
                'date': date,
                'description': description,
                'amount': abs(amount),
                'type': tx_type.value,
                'category': category,
                'tags': [],
                'is_anomaly': False,
                'created_at': datetime.now(timezone.utc).isoformat()
            })
    except Exception as e:
        logger.error(f"Error parsing Excel: {e}")
    
    return transactions

async def parse_pdf_file(content: bytes) -> List[dict]:
    """Parse PDF file and extract text (basic extraction)"""
    transactions = []
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        # Simple line-by-line parsing
        lines = text.split('\n')
        for line in lines:
            # Try to find date patterns and amounts
            parts = line.split()
            if len(parts) >= 3:
                # Look for amount-like patterns
                for i, part in enumerate(parts):
                    clean_part = part.replace('$', '').replace(',', '')
                    try:
                        amount = float(clean_part)
                        if abs(amount) > 0.01:  # Valid amount
                            date = parts[0] if '/' in parts[0] or '-' in parts[0] else datetime.now().strftime('%Y-%m-%d')
                            description = ' '.join(parts[1:i]) if i > 1 else 'PDF Transaction'
                            
                            tx_type = TransactionType.EXPENSE if amount < 0 else TransactionType.INCOME
                            category = categorize_transaction(description)
                            
                            transactions.append({
                                'id': str(uuid.uuid4()),
                                'date': date,
                                'description': description[:100],
                                'amount': abs(amount),
                                'type': tx_type.value,
                                'category': category,
                                'tags': [],
                                'is_anomaly': False,
                                'created_at': datetime.now(timezone.utc).isoformat()
                            })
                            break
                    except:
                        continue
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
    
    return transactions

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "FinanceFlow API - Your Smart Financial Assistant"}

# ---------- TRANSACTIONS ----------
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    """Create a new transaction"""
    tx_dict = input.model_dump()
    tx_dict['id'] = str(uuid.uuid4())
    tx_dict['is_anomaly'] = False
    tx_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    # Auto-categorize if not provided or is "Other"
    if tx_dict['category'] == "Other":
        tx_dict['category'] = categorize_transaction(tx_dict['description'])
    
    await db.transactions.insert_one(tx_dict)
    return Transaction(**tx_dict)

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(default=1000, le=5000)
):
    """Get all transactions with optional filters"""
    query = {}
    
    if start_date:
        query['date'] = {'$gte': start_date}
    if end_date:
        if 'date' in query:
            query['date']['$lte'] = end_date
        else:
            query['date'] = {'$lte': end_date}
    if category:
        query['category'] = category
    if type:
        query['type'] = type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(limit)
    return transactions

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    """Get a single transaction"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Transaction(**transaction)

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionUpdate):
    """Update a transaction"""
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    return Transaction(**transaction)

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    """Delete a transaction"""
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

@api_router.delete("/transactions")
async def delete_all_transactions():
    """Delete all transactions"""
    result = await db.transactions.delete_many({})
    return {"message": f"Deleted {result.deleted_count} transactions"}

# ---------- FILE UPLOAD ----------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and parse a financial file (CSV, Excel, PDF)"""
    content = await file.read()
    filename = file.filename.lower()
    
    transactions = []
    
    if filename.endswith('.csv'):
        transactions = await parse_csv_file(content)
    elif filename.endswith(('.xlsx', '.xls')):
        transactions = await parse_excel_file(content)
    elif filename.endswith('.pdf'):
        transactions = await parse_pdf_file(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV, Excel, or PDF")
    
    # Detect anomalies
    anomaly_ids = detect_anomalies(transactions)
    for tx in transactions:
        if tx['id'] in anomaly_ids:
            tx['is_anomaly'] = True
    
    # Save to database
    if transactions:
        await db.transactions.insert_many(transactions)
    
    return {
        "message": f"Successfully imported {len(transactions)} transactions",
        "transactions_count": len(transactions),
        "anomalies_detected": len(anomaly_ids)
    }

# ---------- BUDGETS ----------
@api_router.post("/budgets", response_model=Budget)
async def create_budget(input: BudgetCreate):
    """Create a new budget"""
    budget_dict = input.model_dump()
    budget_dict['id'] = str(uuid.uuid4())
    budget_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.budgets.insert_one(budget_dict)
    return Budget(**budget_dict)

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets():
    """Get all budgets"""
    budgets = await db.budgets.find({}, {"_id": 0}).to_list(100)
    return budgets

@api_router.get("/budgets/{budget_id}", response_model=Budget)
async def get_budget(budget_id: str):
    """Get a single budget"""
    budget = await db.budgets.find_one({"id": budget_id}, {"_id": 0})
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return Budget(**budget)

@api_router.put("/budgets/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, input: BudgetCreate):
    """Update a budget"""
    update_data = input.model_dump()
    
    result = await db.budgets.update_one(
        {"id": budget_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    budget = await db.budgets.find_one({"id": budget_id}, {"_id": 0})
    return Budget(**budget)

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str):
    """Delete a budget"""
    result = await db.budgets.delete_one({"id": budget_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted successfully"}

@api_router.get("/budgets/status/all")
async def get_budget_status():
    """Get budget vs actual spending status"""
    budgets = await db.budgets.find({}, {"_id": 0}).to_list(100)
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(5000)
    
    status = []
    for budget in budgets:
        # Calculate spent amount for this budget category
        category_txns = [
            t for t in transactions 
            if t['category'] == budget['category'] 
            and t['type'] == 'expense'
            and budget['start_date'] <= t['date'] <= budget['end_date']
        ]
        spent = sum(t['amount'] for t in category_txns)
        
        status.append({
            'budget_id': budget['id'],
            'category': budget['category'],
            'limit': budget['limit'],
            'spent': round(spent, 2),
            'remaining': round(budget['limit'] - spent, 2),
            'percentage': round((spent / budget['limit'] * 100) if budget['limit'] > 0 else 0, 2),
            'status': 'over' if spent > budget['limit'] else 'warning' if spent > budget['limit'] * 0.8 else 'good'
        })
    
    return status

# ---------- ANALYTICS ----------
@api_router.get("/analytics/summary")
async def get_analytics_summary():
    """Get financial analytics summary"""
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(5000)
    
    if not transactions:
        return {
            "total_income": 0,
            "total_expenses": 0,
            "net_balance": 0,
            "transaction_count": 0,
            "top_categories": [],
            "monthly_trend": []
        }
    
    # Calculate totals
    income_txns = [t for t in transactions if t['type'] == 'income']
    expense_txns = [t for t in transactions if t['type'] == 'expense']
    
    total_income = sum(t['amount'] for t in income_txns)
    total_expenses = sum(t['amount'] for t in expense_txns)
    
    # Top expense categories
    category_totals = {}
    for t in expense_txns:
        cat = t['category']
        category_totals[cat] = category_totals.get(cat, 0) + t['amount']
    
    top_categories = sorted(
        [{'category': k, 'amount': round(v, 2)} for k, v in category_totals.items()],
        key=lambda x: x['amount'],
        reverse=True
    )[:5]
    
    # Monthly trend
    monthly_data = {}
    for t in transactions:
        month = t['date'][:7]
        if month not in monthly_data:
            monthly_data[month] = {'income': 0, 'expense': 0}
        if t['type'] == 'income':
            monthly_data[month]['income'] += t['amount']
        else:
            monthly_data[month]['expense'] += t['amount']
    
    monthly_trend = [
        {
            'month': k,
            'income': round(v['income'], 2),
            'expense': round(v['expense'], 2),
            'net': round(v['income'] - v['expense'], 2)
        }
        for k, v in sorted(monthly_data.items())
    ]
    
    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_balance": round(total_income - total_expenses, 2),
        "transaction_count": len(transactions),
        "top_categories": top_categories,
        "monthly_trend": monthly_trend
    }

@api_router.get("/analytics/cash-flow")
async def get_cash_flow_forecast(months: int = Query(default=6, le=12)):
    """Get cash flow forecast"""
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(5000)
    forecasts = forecast_cash_flow(transactions, months)
    
    return {
        "historical_months": len(set(t['date'][:7] for t in transactions)),
        "forecast_months": months,
        "forecasts": forecasts
    }

@api_router.get("/analytics/anomalies")
async def get_anomalies():
    """Get all anomalous transactions"""
    # Re-detect anomalies on current data
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(5000)
    anomaly_ids = detect_anomalies(transactions)
    
    # Update anomaly flags
    for tx in transactions:
        is_anomaly = tx['id'] in anomaly_ids
        if tx.get('is_anomaly') != is_anomaly:
            await db.transactions.update_one(
                {"id": tx['id']},
                {"$set": {"is_anomaly": is_anomaly}}
            )
    
    anomalies = [t for t in transactions if t['id'] in anomaly_ids]
    return {
        "count": len(anomalies),
        "anomalies": anomalies
    }

@api_router.get("/analytics/categories")
async def get_category_breakdown():
    """Get expense breakdown by category"""
    transactions = await db.transactions.find({"type": "expense"}, {"_id": 0}).to_list(5000)
    
    category_totals = {}
    for t in transactions:
        cat = t['category']
        category_totals[cat] = category_totals.get(cat, 0) + t['amount']
    
    total = sum(category_totals.values())
    
    breakdown = [
        {
            'category': k,
            'amount': round(v, 2),
            'percentage': round((v / total * 100) if total > 0 else 0, 2)
        }
        for k, v in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    return {"total": round(total, 2), "breakdown": breakdown}

# ---------- USER SETTINGS ----------
@api_router.get("/settings")
async def get_settings():
    """Get user settings"""
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        # Create default settings
        default = UserSettings().model_dump()
        await db.settings.insert_one(default)
        return default
    return settings

@api_router.put("/settings")
async def update_settings(input: UserSettingsUpdate):
    """Update user settings"""
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one(
        {"id": "default"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    return settings

# ---------- CURRENCIES ----------
@api_router.get("/currencies")
async def get_currencies():
    """Get all supported currencies with details"""
    currencies = [
        {"code": "USD", "symbol": "$", "name": "US Dollar", "locale": "en-US"},
        {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "locale": "en-IN"},
        {"code": "EUR", "symbol": "€", "name": "Euro", "locale": "de-DE"},
        {"code": "GBP", "symbol": "£", "name": "British Pound", "locale": "en-GB"},
        {"code": "JPY", "symbol": "¥", "name": "Japanese Yen", "locale": "ja-JP"},
        {"code": "AUD", "symbol": "A$", "name": "Australian Dollar", "locale": "en-AU"},
        {"code": "CAD", "symbol": "C$", "name": "Canadian Dollar", "locale": "en-CA"},
        {"code": "CHF", "symbol": "CHF", "name": "Swiss Franc", "locale": "de-CH"},
        {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan", "locale": "zh-CN"},
        {"code": "SGD", "symbol": "S$", "name": "Singapore Dollar", "locale": "en-SG"},
    ]
    return {"currencies": currencies}

@api_router.get("/countries")
async def get_countries():
    """Get supported countries with tax info"""
    countries = [
        {"code": "US", "name": "United States", "currency": "USD", "has_state_tax": True},
        {"code": "IN", "name": "India", "currency": "INR", "has_state_tax": False},
        {"code": "UK", "name": "United Kingdom", "currency": "GBP", "has_state_tax": False},
        {"code": "AU", "name": "Australia", "currency": "AUD", "has_state_tax": False},
        {"code": "CA", "name": "Canada", "currency": "CAD", "has_state_tax": True},
        {"code": "DE", "name": "Germany", "currency": "EUR", "has_state_tax": False},
        {"code": "SG", "name": "Singapore", "currency": "SGD", "has_state_tax": False},
    ]
    return {"countries": countries}

# ---------- TAX ESTIMATION ----------
@api_router.post("/tax/estimate", response_model=TaxEstimateResponse)
async def estimate_tax(input: TaxEstimateRequest):
    """Calculate estimated taxes based on country"""
    country = input.country.upper()
    
    # Standard deductions by country
    standard_deductions = {
        "US": {"single": 14600, "married": 29200, "head_of_household": 21900},
        "IN": {"single": 75000, "married": 75000},  # India standard deduction
        "UK": {"single": 12570, "married": 12570},  # Personal allowance
    }
    
    country_deductions = standard_deductions.get(country, standard_deductions["US"])
    default_deduction = country_deductions.get(input.filing_status, list(country_deductions.values())[0])
    
    total_deductions = max(input.deductions, default_deduction)
    taxable_income = max(0, input.annual_income - total_deductions)
    
    federal_tax, marginal_rate = calculate_federal_tax(taxable_income, input.filing_status, country)
    state_tax = calculate_state_tax(taxable_income, input.state, country)
    total_tax = federal_tax + state_tax
    
    effective_rate = (total_tax / input.annual_income * 100) if input.annual_income > 0 else 0
    
    # Get currency for country
    currency_map = {"US": "USD", "IN": "INR", "UK": "GBP", "AU": "AUD", "CA": "CAD"}
    currency = currency_map.get(country, "USD")
    
    return TaxEstimateResponse(
        gross_income=round(input.annual_income, 2),
        deductions=round(total_deductions, 2),
        taxable_income=round(taxable_income, 2),
        federal_tax=round(federal_tax, 2),
        state_tax=round(state_tax, 2),
        total_tax=round(total_tax, 2),
        effective_rate=round(effective_rate, 2),
        marginal_rate=round(marginal_rate * 100, 2),
        currency=currency
    )

@api_router.get("/tax/estimate-from-transactions")
async def estimate_tax_from_transactions(
    filing_status: str = "single",
    state: str = "CA",
    country: str = "US"
):
    """Estimate taxes based on transaction history"""
    transactions = await db.transactions.find({"type": "income"}, {"_id": 0}).to_list(5000)
    
    # Calculate annual income from transactions
    total_income = sum(t['amount'] for t in transactions)
    
    # Get expense deductions
    expense_txns = await db.transactions.find({"type": "expense"}, {"_id": 0}).to_list(5000)
    deductible_categories = ['Healthcare', 'Taxes', 'Insurance']
    deductions = sum(t['amount'] for t in expense_txns if t['category'] in deductible_categories)
    
    request = TaxEstimateRequest(
        annual_income=total_income,
        deductions=deductions,
        filing_status=filing_status,
        state=state,
        country=country
    )
    
    return await estimate_tax(request)

# ---------- INVESTMENT SUGGESTIONS ----------
@api_router.get("/investments/suggestions")
async def get_investment_suggestions_endpoint(current_savings: float = Query(default=0)):
    """Get investment suggestions based on financial data"""
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(5000)
    suggestions = get_investment_suggestions(transactions, current_savings)
    
    return {
        "current_savings": current_savings,
        "suggestions": suggestions
    }

# ---------- REPORTS ----------
@api_router.get("/reports/monthly/{year}/{month}")
async def get_monthly_report(year: int, month: int):
    """Get monthly financial report"""
    month_str = f"{year}-{month:02d}"
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(5000)
    month_txns = [t for t in transactions if t['date'].startswith(month_str)]
    
    income = sum(t['amount'] for t in month_txns if t['type'] == 'income')
    expenses = sum(t['amount'] for t in month_txns if t['type'] == 'expense')
    
    # Category breakdown
    category_breakdown = {}
    for t in month_txns:
        if t['type'] == 'expense':
            cat = t['category']
            category_breakdown[cat] = category_breakdown.get(cat, 0) + t['amount']
    
    return {
        "month": month_str,
        "summary": {
            "total_income": round(income, 2),
            "total_expenses": round(expenses, 2),
            "net_savings": round(income - expenses, 2),
            "savings_rate": round((income - expenses) / income * 100, 2) if income > 0 else 0
        },
        "transaction_count": len(month_txns),
        "category_breakdown": [
            {"category": k, "amount": round(v, 2)}
            for k, v in sorted(category_breakdown.items(), key=lambda x: x[1], reverse=True)
        ],
        "transactions": month_txns
    }

@api_router.get("/reports/yearly/{year}")
async def get_yearly_report(year: int):
    """Get yearly financial report"""
    year_str = str(year)
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    year_txns = [t for t in transactions if t['date'].startswith(year_str)]
    
    income = sum(t['amount'] for t in year_txns if t['type'] == 'income')
    expenses = sum(t['amount'] for t in year_txns if t['type'] == 'expense')
    
    # Monthly breakdown
    monthly_data = {}
    for t in year_txns:
        month = t['date'][:7]
        if month not in monthly_data:
            monthly_data[month] = {'income': 0, 'expense': 0}
        if t['type'] == 'income':
            monthly_data[month]['income'] += t['amount']
        else:
            monthly_data[month]['expense'] += t['amount']
    
    return {
        "year": year,
        "summary": {
            "total_income": round(income, 2),
            "total_expenses": round(expenses, 2),
            "net_savings": round(income - expenses, 2),
            "average_monthly_income": round(income / 12, 2),
            "average_monthly_expenses": round(expenses / 12, 2)
        },
        "monthly_breakdown": [
            {
                "month": k,
                "income": round(v['income'], 2),
                "expense": round(v['expense'], 2),
                "net": round(v['income'] - v['expense'], 2)
            }
            for k, v in sorted(monthly_data.items())
        ]
    }

# ---------- CATEGORIES ----------
@api_router.get("/categories")
async def get_categories():
    """Get all available categories"""
    return {"categories": [c.value for c in Category]}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
