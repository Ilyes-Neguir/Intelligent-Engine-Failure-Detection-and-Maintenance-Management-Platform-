from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import joblib
import tensorflow as tf
from tensorflow import keras
import uvicorn
      
app = FastAPI(
    title="Engine Fault Detection API",
    description="API for predicting engine faults",
    version="1.0.0"
)

model = None
scaler = None

FEATURE_NAMES = [
    'MAP', 'TPS', 'Force', 'Power', 'RPM',
    'Consumption L/H', 'Consumption L/100KM', 'Speed',
    'CO', 'HC', 'CO2', 'O2', 'Lambda', 'AFR'
]

FAULT_LABELS = {
    0: "Normal/Baseline Operation",
    1: "Rich Mixture Problems",
    2: "Combustion Efficiency Problems (Misfire/Lean)"
}

class EngineReading(BaseModel):
    MAP: float
    TPS: float
    Force: float
    Power: float
    RPM: float
    Consumption_LH: float
    Consumption_L100KM: float
    Speed: float
    CO: float
    HC: float
    CO2: float
    O2: float
    Lambda: float
    AFR: float

class PredictionResult(BaseModel):
    predicted_fault: int
    fault_description: str
    confidence: float

def load_models():
    global model, scaler
    
    try:
        # Load the neural network model
        model = keras.models.load_model("../../models/engine_fault_nn_model.keras")
        print("Model loaded successfully")
        
        # Load the feature scaler
        scaler = joblib.load("../../feature_scaler.pkl")
        print("Scaler loaded successfully")
        
    except Exception as e:
        print(f"Error loading models: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Load models when the API starts"""
    load_models()

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Engine Fault Detection API", 
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if (model is not None and scaler is not None) else "unhealthy",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None
    }

@app.post("/predict", response_model=PredictionResult)
def predict_fault(data: EngineReading):
    """Predict engine fault from sensor readings"""
    
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        # Convert to array format
        values = np.array([[
            data.MAP, data.TPS, data.Force, data.Power, data.RPM,
            data.Consumption_LH, data.Consumption_L100KM, data.Speed,
            data.CO, data.HC, data.CO2, data.O2, data.Lambda, data.AFR
        ]])
        
        # Scale features
        values_scaled = scaler.transform(values)
        
        # Make prediction
        prediction = model.predict(values_scaled, verbose=0)
        predicted_class = int(np.argmax(prediction[0]))
        confidence = float(prediction[0][predicted_class] * 100)
        
        return PredictionResult(
            predicted_fault=predicted_class,
            fault_description=FAULT_LABELS[predicted_class],
            confidence=round(confidence, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    print("Engine Fault Detection API")
    print("Starting server on http://localhost:8001")
    print("API docs: http://localhost:8001/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)