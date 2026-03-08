"""
Backend API Tests for FinanceFlow - Currency Conversion System
Tests: Settings, Analytics/Converted, Currency Conversion, Transactions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health check and API availability tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API Root: {data['message']}")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"Categories count: {len(data['categories'])}")


class TestSettingsAPI:
    """Settings API tests - Currency and Country configuration"""
    
    def test_get_settings(self):
        """Test GET /api/settings returns current settings"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "currency" in data
        assert "country" in data
        print(f"Current settings: currency={data['currency']}, country={data['country']}")
        return data
    
    def test_update_settings_to_inr(self):
        """Test updating settings to INR currency"""
        response = requests.put(f"{BASE_URL}/api/settings", json={
            "currency": "INR",
            "country": "IN"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["currency"] == "INR"
        assert data["country"] == "IN"
        print(f"Settings updated to: currency={data['currency']}, country={data['country']}")
    
    def test_update_settings_to_usd(self):
        """Test updating settings to USD currency"""
        response = requests.put(f"{BASE_URL}/api/settings", json={
            "currency": "USD",
            "country": "US"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["currency"] == "USD"
        assert data["country"] == "US"
        print(f"Settings updated to: currency={data['currency']}, country={data['country']}")
    
    def test_update_settings_to_eur(self):
        """Test updating settings to EUR currency"""
        response = requests.put(f"{BASE_URL}/api/settings", json={
            "currency": "EUR",
            "country": "DE"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["currency"] == "EUR"
        print(f"Settings updated to: currency={data['currency']}")


class TestAnalyticsConvertedAPI:
    """Analytics Converted API tests - Dashboard currency conversion"""
    
    def test_analytics_summary_converted_usd(self):
        """Test /api/analytics/summary/converted with USD base currency"""
        response = requests.get(f"{BASE_URL}/api/analytics/summary/converted", params={
            "base_currency": "USD"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "total_income" in data
        assert "total_expenses" in data
        assert "net_balance" in data
        assert "base_currency" in data
        assert data["base_currency"] == "USD"
        
        print(f"USD Summary: income={data['total_income']}, expenses={data['total_expenses']}, balance={data['net_balance']}")
        return data
    
    def test_analytics_summary_converted_inr(self):
        """Test /api/analytics/summary/converted with INR base currency"""
        response = requests.get(f"{BASE_URL}/api/analytics/summary/converted", params={
            "base_currency": "INR"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "total_income" in data
        assert "total_expenses" in data
        assert "net_balance" in data
        assert data["base_currency"] == "INR"
        
        print(f"INR Summary: income={data['total_income']}, expenses={data['total_expenses']}, balance={data['net_balance']}")
        return data
    
    def test_analytics_summary_converted_eur(self):
        """Test /api/analytics/summary/converted with EUR base currency"""
        response = requests.get(f"{BASE_URL}/api/analytics/summary/converted", params={
            "base_currency": "EUR"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["base_currency"] == "EUR"
        print(f"EUR Summary: income={data['total_income']}, expenses={data['total_expenses']}")
        return data
    
    def test_currency_conversion_values_differ(self):
        """Verify that USD and INR values are different (conversion is working)"""
        usd_response = requests.get(f"{BASE_URL}/api/analytics/summary/converted", params={
            "base_currency": "USD"
        })
        inr_response = requests.get(f"{BASE_URL}/api/analytics/summary/converted", params={
            "base_currency": "INR"
        })
        
        assert usd_response.status_code == 200
        assert inr_response.status_code == 200
        
        usd_data = usd_response.json()
        inr_data = inr_response.json()
        
        # If there are transactions, values should differ
        if usd_data["transaction_count"] > 0:
            # INR values should be significantly higher than USD (roughly 83x)
            assert inr_data["total_income"] != usd_data["total_income"], "INR and USD income should differ"
            
            # Check that INR is roughly 80-90x USD (exchange rate varies)
            if usd_data["total_income"] > 0:
                ratio = inr_data["total_income"] / usd_data["total_income"]
                print(f"INR/USD ratio: {ratio:.2f}")
                assert 70 < ratio < 100, f"INR/USD ratio should be ~83, got {ratio}"
        
        print(f"USD income: {usd_data['total_income']}, INR income: {inr_data['total_income']}")


class TestCurrencyConversionAPI:
    """Currency Conversion API tests"""
    
    def test_convert_usd_to_inr(self):
        """Test converting USD to INR"""
        response = requests.post(f"{BASE_URL}/api/exchange/convert", json={
            "amount": 1000,
            "from_currency": "USD",
            "to_currency": "INR"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "converted_amount" in data
        assert "exchange_rate" in data
        assert data["original_currency"] == "USD"
        assert data["target_currency"] == "INR"
        
        # INR should be roughly 83x USD
        assert data["converted_amount"] > 70000, "1000 USD should be > 70000 INR"
        assert data["converted_amount"] < 100000, "1000 USD should be < 100000 INR"
        
        print(f"$1000 USD = ₹{data['converted_amount']:.2f} INR (rate: {data['exchange_rate']})")
    
    def test_convert_inr_to_usd(self):
        """Test converting INR to USD"""
        response = requests.post(f"{BASE_URL}/api/exchange/convert", json={
            "amount": 75000,
            "from_currency": "INR",
            "to_currency": "USD"
        })
        assert response.status_code == 200
        data = response.json()
        
        # 75000 INR should be roughly $900 USD
        assert data["converted_amount"] > 700, "75000 INR should be > $700 USD"
        assert data["converted_amount"] < 1100, "75000 INR should be < $1100 USD"
        
        print(f"₹75000 INR = ${data['converted_amount']:.2f} USD (rate: {data['exchange_rate']})")
    
    def test_convert_eur_to_gbp(self):
        """Test converting EUR to GBP"""
        response = requests.post(f"{BASE_URL}/api/exchange/convert", json={
            "amount": 1000,
            "from_currency": "EUR",
            "to_currency": "GBP"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["original_currency"] == "EUR"
        assert data["target_currency"] == "GBP"
        print(f"€1000 EUR = £{data['converted_amount']:.2f} GBP")
    
    def test_convert_same_currency(self):
        """Test converting same currency returns same amount"""
        response = requests.post(f"{BASE_URL}/api/exchange/convert", json={
            "amount": 1000,
            "from_currency": "USD",
            "to_currency": "USD"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["converted_amount"] == 1000
        assert data["exchange_rate"] == 1.0
        print("Same currency conversion: 1000 USD = 1000 USD")


class TestExchangeRatesAPI:
    """Exchange Rates API tests"""
    
    def test_get_exchange_rates_usd(self):
        """Test getting exchange rates with USD base"""
        response = requests.get(f"{BASE_URL}/api/exchange/rates/USD")
        assert response.status_code == 200
        data = response.json()
        
        assert "rates" in data
        assert "INR" in data["rates"]
        assert "EUR" in data["rates"]
        assert "GBP" in data["rates"]
        
        print(f"USD rates: INR={data['rates']['INR']}, EUR={data['rates']['EUR']}, GBP={data['rates']['GBP']}")
    
    def test_get_all_currencies(self):
        """Test getting all supported currencies"""
        response = requests.get(f"{BASE_URL}/api/exchange/currencies/all")
        assert response.status_code == 200
        data = response.json()
        
        assert "currencies" in data
        assert len(data["currencies"]) > 100, "Should have 100+ currencies"
        
        # Check for common currencies
        currency_codes = [c["code"] for c in data["currencies"]]
        assert "USD" in currency_codes
        assert "INR" in currency_codes
        assert "EUR" in currency_codes
        
        print(f"Total currencies: {len(data['currencies'])}")
    
    def test_get_popular_currencies(self):
        """Test getting popular currencies"""
        response = requests.get(f"{BASE_URL}/api/exchange/popular")
        assert response.status_code == 200
        data = response.json()
        
        assert "currencies" in data
        print(f"Popular currencies: {[c['code'] for c in data['currencies']]}")
    
    def test_get_fx_volatility(self):
        """Test FX volatility endpoint"""
        response = requests.get(f"{BASE_URL}/api/exchange/volatility/USD/INR", params={
            "days": 30
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "volatility" in data
        assert "volatility_level" in data
        assert "trend" in data
        
        print(f"USD/INR volatility: {data['volatility']}% ({data['volatility_level']}), trend: {data['trend']}")
    
    def test_get_historical_rates(self):
        """Test historical rates endpoint"""
        response = requests.get(f"{BASE_URL}/api/exchange/historical/USD/INR", params={
            "days": 30
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data
        assert len(data["data"]) > 0
        
        print(f"Historical data points: {len(data['data'])}")


class TestTransactionsAPI:
    """Transactions API tests"""
    
    def test_get_transactions(self):
        """Test getting all transactions"""
        response = requests.get(f"{BASE_URL}/api/transactions")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Total transactions: {len(data)}")
        
        # Check transaction structure if any exist
        if len(data) > 0:
            tx = data[0]
            assert "id" in tx
            assert "amount" in tx
            assert "type" in tx
            assert "description" in tx
            
            # Check for original_currency field (critical for conversion)
            if "original_currency" in tx:
                print(f"Transaction has original_currency: {tx['original_currency']}")
            else:
                print("WARNING: Transaction missing original_currency field")
        
        return data
    
    def test_transactions_converted_usd(self):
        """Test getting transactions converted to USD"""
        response = requests.get(f"{BASE_URL}/api/transactions/converted", params={
            "base_currency": "USD",
            "limit": 100
        })
        
        # This endpoint may return 404 if no transactions exist
        if response.status_code == 404:
            print("No transactions to convert (404 expected)")
            return
        
        assert response.status_code == 200
        data = response.json()
        
        assert "transactions" in data
        assert "base_currency" in data
        assert data["base_currency"] == "USD"
        
        print(f"Converted transactions count: {len(data['transactions'])}")
    
    def test_transactions_converted_inr(self):
        """Test getting transactions converted to INR"""
        response = requests.get(f"{BASE_URL}/api/transactions/converted", params={
            "base_currency": "INR",
            "limit": 100
        })
        
        if response.status_code == 404:
            print("No transactions to convert (404 expected)")
            return
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["base_currency"] == "INR"
        print(f"INR converted transactions: {len(data['transactions'])}")


class TestTaxEstimatorAPI:
    """Tax Estimator API tests for USA and India"""
    
    def test_tax_estimate_usa(self):
        """Test tax estimation for USA"""
        response = requests.post(f"{BASE_URL}/api/tax/estimate", json={
            "annual_income": 100000,
            "deductions": 14600,
            "filing_status": "single",
            "state": "CA",
            "country": "US"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "federal_tax" in data
        assert "state_tax" in data
        assert "total_tax" in data
        assert "effective_rate" in data
        
        print(f"USA Tax: federal=${data['federal_tax']:.2f}, state=${data['state_tax']:.2f}, total=${data['total_tax']:.2f}, effective_rate={data['effective_rate']:.2f}%")
    
    def test_tax_estimate_india(self):
        """Test tax estimation for India"""
        response = requests.post(f"{BASE_URL}/api/tax/estimate", json={
            "annual_income": 1500000,  # 15 lakh INR
            "deductions": 75000,  # Standard deduction
            "filing_status": "single",
            "state": "MH",  # Maharashtra
            "country": "IN"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "federal_tax" in data
        assert "total_tax" in data
        
        print(f"India Tax: central=₹{data['federal_tax']:.2f}, total=₹{data['total_tax']:.2f}, effective_rate={data['effective_rate']:.2f}%")
    
    def test_tax_estimate_uk(self):
        """Test tax estimation for UK"""
        response = requests.post(f"{BASE_URL}/api/tax/estimate", json={
            "annual_income": 75000,
            "deductions": 0,
            "filing_status": "single",
            "state": "EN",
            "country": "UK"
        })
        assert response.status_code == 200
        data = response.json()
        
        print(f"UK Tax: total=£{data['total_tax']:.2f}, effective_rate={data['effective_rate']:.2f}%")


class TestBudgetAPI:
    """Budget API tests"""
    
    def test_get_budgets(self):
        """Test getting all budgets"""
        response = requests.get(f"{BASE_URL}/api/budgets")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Total budgets: {len(data)}")
    
    def test_get_budget_status(self):
        """Test getting budget status"""
        response = requests.get(f"{BASE_URL}/api/budgets/status/all")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Budget status entries: {len(data)}")


class TestAnalyticsAPI:
    """Analytics API tests"""
    
    def test_analytics_summary(self):
        """Test basic analytics summary"""
        response = requests.get(f"{BASE_URL}/api/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_income" in data
        assert "total_expenses" in data
        assert "transaction_count" in data
        
        print(f"Analytics: income={data['total_income']}, expenses={data['total_expenses']}, count={data['transaction_count']}")
    
    def test_cash_flow_forecast(self):
        """Test cash flow forecast"""
        response = requests.get(f"{BASE_URL}/api/analytics/cash-flow", params={
            "months": 6
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "forecasts" in data
        print(f"Cash flow forecast months: {len(data['forecasts'])}")
    
    def test_anomalies(self):
        """Test anomalies detection"""
        response = requests.get(f"{BASE_URL}/api/analytics/anomalies")
        assert response.status_code == 200
        data = response.json()
        
        assert "anomalies" in data
        print(f"Anomalies detected: {len(data['anomalies'])}")


class TestPortfolioAPI:
    """Portfolio API tests"""
    
    def test_get_portfolio_summary(self):
        """Test portfolio summary"""
        response = requests.get(f"{BASE_URL}/api/portfolio/summary", params={
            "base_currency": "USD"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "total_value" in data
        assert "asset_count" in data
        
        print(f"Portfolio: total={data['total_value']}, assets={data['asset_count']}")
    
    def test_get_portfolio_allocation(self):
        """Test portfolio allocation"""
        response = requests.get(f"{BASE_URL}/api/portfolio/allocation", params={
            "base_currency": "USD"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "currency_allocation" in data
        print(f"Portfolio allocation entries: {len(data['currency_allocation'])}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
