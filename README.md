# Engine Fault Detection Platform

Machine learning system for intelligent engine failure detection and maintenance management.

## Structure
```
├── src/api/           # API service files
├── data/              # Dataset 
├── models/            # Trained ML models
├── tests/             # Test files
├── notebooks/         # Analysis notebooks
└── requirements.txt   # Dependencies
```

## Quick Start
```bash
pip install -r requirements.txt
python src/api/simple_api.py
```

API runs at `http://localhost:8001`

## Files
- **src/api/simple_api.py** - FastAPI web service
- **tests/simple_test.py** - API testing
- **tests/manual_prediction_tester.py** - Manual testing tool
- **models/engine_fault_nn_model.keras** - Trained neural network
- **models/feature_scaler.pkl** - Data scaler
- **data/EngineFaultDB_Final.csv** - Training dataset