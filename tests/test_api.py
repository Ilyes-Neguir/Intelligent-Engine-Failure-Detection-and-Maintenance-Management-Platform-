import requests
import json

# API URL
API_URL = "http://localhost:8001"

def test_health():
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"API Status: {data['status']}")
            print(f"Model loaded: {data['model_loaded']}")
            print(f"Scaler loaded: {data['scaler_loaded']}")
            return True
        else:
            print(f"Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("Cannot connect to API. Is the server running?")
        return False

def test_prediction():
    test_data = {
        "MAP": 2.3,
        "TPS": 1.2,
        "Force": 850,
        "Power": 15.5,
        "RPM": 3000,
        "Consumption_LH": 8.5,
        "Consumption_L100KM": 12.0,
        "Speed": 60,
        "CO": 2.5,
        "HC": 150,
        "CO2": 12.0,
        "O2": 0.8,
        "Lambda": 1.0,
        "AFR": 14.7
    }
    test_data = {
        "MAP": 1.634,
        "TPS": 1.054,
        "Force": 107.971,
        "Power": 2.257,
        "RPM": 3302.101,
        "Consumption_LH": 4.511,
        "Consumption_L100KM": 6.206,
        "Speed": 69.3,
        "CO": 0.62,
        "HC": 151.536,
        "CO2": 13.759,
        "O2": 0.69,
        "Lambda": 0.962,
        "AFR": 14.145
    }
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json=test_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Prediction successful!")
            print(f"Fault: {result['predicted_fault']}")
            print(f"Description: {result['fault_description']}")
            print(f"Confidence: {result['confidence']}%")
            return True
        else:
            print(f"Prediction failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error making prediction: {e}")
        return False

if __name__ == "__main__":
    print("Testing Engine Fault API")
    
    if test_health():
        print("\nTesting prediction...")
        test_prediction()
    else:
        print("API is not healthy. Please start the server first.")
        print("Run: python simple_api.py")