# Engine Fault Detection System

A machine learning system for detecting engine faults using OBD sensor data with a trained neural network achieving 100% accuracy.

## 🚀 Features

- **Neural Network Model**: Trained model for engine fault classification
- **FastAPI Web Service**: RESTful API for real-time predictions
- **Interactive Testing**: Tools for manual testing with custom sensor values
- **High Accuracy**: 100% accuracy on test dataset

## 📁 Project Structure

```
├── src/api/main.py           # FastAPI web service
├── tests/                    # Testing tools
├── models/                   # Trained ML models
├── data/                     # Dataset
├── notebooks/                # Jupyter analysis notebook
├── requirements.txt          # Python dependencies
└── README.md                # This file
```

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/engine-fault-detection.git
cd engine-fault-detection
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## 🚀 Usage

### Start the API Server
```bash
python src/api/main.py
```

The API will be available at `http://localhost:8001`

### API Documentation
Visit `http://localhost:8001/docs` for interactive API documentation

### Test the API
```bash
python tests/test_api.py
```

### Manual Testing
```bash
python tests/manual_prediction_tester.py
```

## 📊 Model Details

- **Input Features**: 14 OBD sensor readings (MAP, TPS, Force, Power, RPM, etc.)
- **Output Classes**: 
  - 0: Normal/Baseline Operation
  - 1: Rich Mixture Problems
  - 2: Combustion Efficiency Problems (Misfire/Lean)
- **Architecture**: Neural Network with TensorFlow/Keras
- **Accuracy**: 100% on test dataset

## 🔧 API Endpoints

- `GET /`: Root endpoint with API info
- `GET /health`: Health check endpoint
- `POST /predict`: Make fault predictions

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request