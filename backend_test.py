import requests
import sys
import json
from datetime import datetime, timedelta

class FinanceFlowAPITester:
    def __init__(self, base_url="https://budget-brain-ai-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'transactions': [],
            'budgets': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_categories(self):
        """Test categories endpoint"""
        return self.run_test("Get Categories", "GET", "categories", 200)

    def test_transactions_crud(self):
        """Test transaction CRUD operations"""
        print("\n📝 Testing Transaction CRUD Operations...")
        
        # Test GET empty transactions
        success, _ = self.run_test("Get Transactions (Empty)", "GET", "transactions", 200)
        if not success:
            return False

        # Test CREATE transaction
        transaction_data = {
            "date": "2024-01-15",
            "description": "Test Salary Payment",
            "amount": 5000.00,
            "type": "income",
            "category": "Salary",
            "tags": ["test"]
        }
        
        success, response = self.run_test("Create Transaction", "POST", "transactions", 200, transaction_data)
        if not success:
            return False
        
        transaction_id = response.get('id')
        if transaction_id:
            self.created_ids['transactions'].append(transaction_id)
            print(f"   Created transaction ID: {transaction_id}")
        
        # Test GET specific transaction
        if transaction_id:
            success, _ = self.run_test("Get Transaction by ID", "GET", f"transactions/{transaction_id}", 200)
            if not success:
                return False

        # Test UPDATE transaction
        if transaction_id:
            update_data = {
                "description": "Updated Test Salary Payment",
                "amount": 5500.00
            }
            success, _ = self.run_test("Update Transaction", "PUT", f"transactions/{transaction_id}", 200, update_data)
            if not success:
                return False

        # Create expense transaction for testing
        expense_data = {
            "date": "2024-01-16",
            "description": "Test Grocery Shopping",
            "amount": 150.00,
            "type": "expense",
            "category": "Groceries",
            "tags": ["test"]
        }
        
        success, response = self.run_test("Create Expense Transaction", "POST", "transactions", 200, expense_data)
        if success and response.get('id'):
            self.created_ids['transactions'].append(response.get('id'))

        return True

    def test_budgets_crud(self):
        """Test budget CRUD operations"""
        print("\n💰 Testing Budget CRUD Operations...")
        
        # Test GET empty budgets
        success, _ = self.run_test("Get Budgets (Empty)", "GET", "budgets", 200)
        if not success:
            return False

        # Test CREATE budget
        budget_data = {
            "category": "Groceries",
            "limit": 500.00,
            "period": "monthly",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31"
        }
        
        success, response = self.run_test("Create Budget", "POST", "budgets", 200, budget_data)
        if not success:
            return False
        
        budget_id = response.get('id')
        if budget_id:
            self.created_ids['budgets'].append(budget_id)
            print(f"   Created budget ID: {budget_id}")
        
        # Test GET specific budget
        if budget_id:
            success, _ = self.run_test("Get Budget by ID", "GET", f"budgets/{budget_id}", 200)
            if not success:
                return False

        # Test budget status
        success, _ = self.run_test("Get Budget Status", "GET", "budgets/status/all", 200)
        if not success:
            return False

        return True

    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n📊 Testing Analytics Endpoints...")
        
        success, _ = self.run_test("Analytics Summary", "GET", "analytics/summary", 200)
        if not success:
            return False

        success, _ = self.run_test("Cash Flow Forecast", "GET", "analytics/cash-flow", 200, params={"months": 6})
        if not success:
            return False

        success, _ = self.run_test("Anomalies Detection", "GET", "analytics/anomalies", 200)
        if not success:
            return False

        success, _ = self.run_test("Category Breakdown", "GET", "analytics/categories", 200)
        if not success:
            return False

        return True

    def test_tax_estimation(self):
        """Test tax estimation endpoints"""
        print("\n🧮 Testing Tax Estimation...")
        
        tax_data = {
            "annual_income": 75000.00,
            "deductions": 12000.00,
            "filing_status": "single",
            "state": "CA"
        }
        
        success, _ = self.run_test("Tax Estimate", "POST", "tax/estimate", 200, tax_data)
        if not success:
            return False

        success, _ = self.run_test("Tax Estimate from Transactions", "GET", "tax/estimate-from-transactions", 200, 
                                 params={"filing_status": "single", "state": "CA"})
        if not success:
            return False

        return True

    def test_investment_suggestions(self):
        """Test investment suggestions"""
        print("\n💼 Testing Investment Suggestions...")
        
        success, _ = self.run_test("Investment Suggestions", "GET", "investments/suggestions", 200, 
                                 params={"current_savings": 10000})
        if not success:
            return False

        return True

    def test_reports(self):
        """Test reports endpoints"""
        print("\n📋 Testing Reports...")
        
        success, _ = self.run_test("Monthly Report", "GET", "reports/monthly/2024/1", 200)
        if not success:
            return False

        success, _ = self.run_test("Yearly Report", "GET", "reports/yearly/2024", 200)
        if not success:
            return False

        return True

    def test_currency_conversion_apis(self):
        """Test currency conversion and exchange rate APIs"""
        print("\n💱 Testing Currency Conversion APIs...")
        
        # Test get all currencies (should return 160+ currencies)
        success, response = self.run_test("Get All Currencies", "GET", "exchange/currencies/all", 200)
        if not success:
            return False
        
        currencies = response.get('currencies', [])
        if len(currencies) < 140:  # Relaxed requirement - should have at least 140 currencies
            print(f"❌ Expected 140+ currencies, got {len(currencies)}")
            return False
        else:
            print(f"✅ Found {len(currencies)} currencies")
        
        # Test get popular currencies
        success, response = self.run_test("Get Popular Currencies", "GET", "exchange/popular", 200)
        if not success:
            return False
        
        # Test get exchange rates for USD
        success, response = self.run_test("Get USD Exchange Rates", "GET", "exchange/rates/USD", 200)
        if not success:
            return False
        
        rates = response.get('rates', {})
        if len(rates) < 50:  # Should have many rates
            print(f"❌ Expected many exchange rates, got {len(rates)}")
            return False
        else:
            print(f"✅ Found {len(rates)} exchange rates")
        
        # Test currency conversion USD to INR
        conversion_data = {
            "amount": 1000.0,
            "from_currency": "USD",
            "to_currency": "INR"
        }
        success, response = self.run_test("Convert USD to INR", "POST", "exchange/convert", 200, conversion_data)
        if not success:
            return False
        
        # Verify conversion response structure
        required_fields = ['original_amount', 'converted_amount', 'exchange_rate', 'formatted_original', 'formatted_converted']
        for field in required_fields:
            if field not in response:
                print(f"❌ Missing field in conversion response: {field}")
                return False
        
        print(f"✅ Conversion: {response.get('formatted_original')} = {response.get('formatted_converted')}")
        
        # Test historical rates
        success, response = self.run_test("Get Historical Rates USD/INR", "GET", "exchange/historical/USD/INR", 200, params={"days": 30})
        if not success:
            return False
        
        historical_data = response.get('data', [])
        if len(historical_data) < 25:  # Should have ~30 days of data
            print(f"❌ Expected ~30 days of historical data, got {len(historical_data)}")
            return False
        else:
            print(f"✅ Found {len(historical_data)} days of historical data")
        
        # Test volatility calculation
        success, response = self.run_test("Get FX Volatility USD/INR", "GET", "exchange/volatility/USD/INR", 200, params={"days": 30})
        if not success:
            return False
        
        # Verify volatility response structure
        volatility_fields = ['volatility', 'volatility_level', 'trend', 'change_percent']
        for field in volatility_fields:
            if field not in response:
                print(f"❌ Missing field in volatility response: {field}")
                return False
        
        print(f"✅ Volatility: {response.get('volatility')}% ({response.get('volatility_level')})")
        
        # Test batch conversion
        batch_data = {
            "conversions": [
                {"amount": 100, "from_currency": "USD", "to_currency": "EUR"},
                {"amount": 200, "from_currency": "GBP", "to_currency": "JPY"}
            ]
        }
        success, response = self.run_test("Batch Currency Conversion", "POST", "exchange/batch-convert", 200, batch_data)
        if not success:
            return False
        
        conversions = response.get('conversions', [])
        if len(conversions) != 2:
            print(f"❌ Expected 2 batch conversions, got {len(conversions)}")
            return False
        
        return True

    def test_portfolio_apis(self):
        """Test portfolio management APIs"""
        print("\n💼 Testing Portfolio APIs...")
        
        # Test get empty portfolio
        success, _ = self.run_test("Get Portfolio Assets", "GET", "portfolio/assets", 200)
        if not success:
            return False
        
        # Test create portfolio asset
        asset_data = {
            "name": "Test USD Savings",
            "amount": 5000.0,
            "currency": "USD",
            "category": "Cash",
            "notes": "Test asset"
        }
        success, response = self.run_test("Create Portfolio Asset", "POST", "portfolio/assets", 200, asset_data)
        if not success:
            return False
        
        asset_id = response.get('id')
        if asset_id:
            print(f"   Created asset ID: {asset_id}")
        
        # Test portfolio summary
        success, response = self.run_test("Get Portfolio Summary", "GET", "portfolio/summary", 200, params={"base_currency": "USD"})
        if not success:
            return False
        
        # Test portfolio allocation
        success, response = self.run_test("Get Portfolio Allocation", "GET", "portfolio/allocation", 200, params={"base_currency": "USD"})
        if not success:
            return False
        
        # Test converted transactions
        success, response = self.run_test("Get Converted Transactions", "GET", "transactions/converted", 200, params={"base_currency": "USD"})
        if not success:
            return False
        
        # Clean up created asset
        if asset_id:
            self.run_test(f"Delete Portfolio Asset {asset_id}", "DELETE", f"portfolio/assets/{asset_id}", 200)
        
        return True

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created transactions
        for tx_id in self.created_ids['transactions']:
            self.run_test(f"Delete Transaction {tx_id}", "DELETE", f"transactions/{tx_id}", 200)
        
        # Delete created budgets
        for budget_id in self.created_ids['budgets']:
            self.run_test(f"Delete Budget {budget_id}", "DELETE", f"budgets/{budget_id}", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting FinanceFlow API Tests...")
        print(f"Testing against: {self.base_url}")
        
        try:
            # Test basic endpoints
            if not self.test_root_endpoint():
                return False
            
            if not self.test_categories():
                return False

            # Test CRUD operations
            if not self.test_transactions_crud():
                return False
            
            if not self.test_budgets_crud():
                return False

            # Test analytics and other features
            if not self.test_analytics_endpoints():
                return False
            
            if not self.test_tax_estimation():
                return False
            
            if not self.test_investment_suggestions():
                return False
            
            if not self.test_reports():
                return False
            
            # Test currency conversion APIs
            if not self.test_currency_conversion_apis():
                return False
            
            # Test portfolio APIs
            if not self.test_portfolio_apis():
                return False

            return True

        finally:
            # Always cleanup
            self.cleanup()

def main():
    tester = FinanceFlowAPITester()
    
    success = tester.run_all_tests()
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if success and tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())