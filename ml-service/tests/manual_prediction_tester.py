import pandas as pd
import numpy as np
import joblib
from tensorflow import keras

model = keras.models.load_model('engine_fault_nn_model.keras')
scaler = joblib.load('feature_scaler.pkl')
FEATURE_NAMES = [
    'MAP', 'TPS', 'Force', 'Power', 'RPM', 
    'Consumption L/H', 'Consumption L/100KM', 'Speed',
    'CO', 'HC', 'CO2', 'O2', 'Lambda', 'AFR'
]

FAULT_LABELS = {
    0: "Fault 0 - Normal/Baseline Operation",
    1: "Fault 1 - Rich Mixture Problems", 
    2: "Fault 2 - Combustion Efficiency Problems (Misfire/Lean)"
}

def get_sample_values():
    """Get typical ranges for each sensor"""
    return {
        'MAP': (0.5, 4.5, "kPa"),
        'TPS': (0.4, 4.0, "%"),
        'Force': (3, 1500, "N"),
        'Power': (0.5, 35, "kW"),
        'RPM': (1000, 5000, "RPM"),
        'Consumption L/H': (2, 15, "L/H"),
        'Consumption L/100KM': (5, 20, "L/100KM"),
        'Speed': (20, 110, "km/h"),
        'CO': (0.4, 10, "%"),
        'HC': (2, 1000, "ppm"),
        'CO2': (8, 16, "%"),
        'O2': (0.2, 1.2, "%"),
        'Lambda': (0.7, 1.2, "λ"),
        'AFR': (10, 17, "ratio")
    }

def predict_fault(values_dict):
    values = np.array([[values_dict[name] for name in FEATURE_NAMES]])
    values_scaled = scaler.transform(values)
    prediction = model.predict(values_scaled, verbose=0)
    predicted_class = np.argmax(prediction[0])
    confidence = prediction[0][predicted_class] * 100
    
    return predicted_class, confidence, prediction[0]

def manual_input_mode():
    ranges = get_sample_values()
    values = {}
    
    for feature in FEATURE_NAMES:
        min_val, max_val, unit = ranges[feature]
        while True:
            try:
                val = input(f"{feature:25s} (Range: {min_val}-{max_val} {unit}): ")
                val = float(val)
                values[feature] = val
                break
            except ValueError:
                print("Invalid number.")
    
    predicted_class, confidence, probabilities = predict_fault(values)
    
    print(f"\n PREDICTION: {FAULT_LABELS[predicted_class]}")
    print(f"   Confidence: {confidence:.1f}%")
    print()
    print("   Class Probabilities:")
    for i in range(3):
        prob = probabilities[i] * 100
        bar = "█" * int(prob / 2)
        print(f"   Fault {i}: {prob:5.1f}% {bar}")
    
    print("\n" + "="*70)

def quick_test_mode():
    """Test with predefined examples"""
    print("\n" + "="*70)
    print("QUICK TEST MODE - Sample Cases")
    print("="*70)
    
    # Load some real samples from dataset
    df = pd.read_csv('EngineFaultDB_Final.csv')
    df['Fault'] = df['Fault'].replace({3: 2})
    
    for fault_type in [0, 1, 2]:
        sample = df[df['Fault'] == fault_type].sample(1).iloc[0]
        
        print(f"\n--- Testing Sample from Fault {fault_type} ---")
        values = {col: sample[col] for col in FEATURE_NAMES}
        
        predicted_class, confidence, _ = predict_fault(values)
        
        actual = int(sample['Fault'])
        match = "✓ CORRECT" if predicted_class == actual else "❌ WRONG"
        
        print(f"Actual:    Fault {actual}")
        print(f"Predicted: Fault {predicted_class} ({confidence:.1f}% confidence) {match}")

def batch_test_mode():
    print("BATCH TEST MODE - Test from CSV")
    filename = input("Enter CSV filename (or press Enter for random samples): ").strip()
    df = pd.read_csv('EngineFaultDB_Final.csv')
    df['Fault'] = df['Fault'].replace({3: 2})
    test_df = df.sample(10)
    correct = 0
    total = len(test_df)
    
    print(f"\nTesting {total} samples...\n")
    
    for idx, row in test_df.iterrows():
        values = {col: row[col] for col in FEATURE_NAMES}
        predicted_class, confidence, _ = predict_fault(values)
        
        if 'Fault' in row:
            actual = int(row['Fault'])
            if predicted_class == actual:
                correct += 1
            else:
            print(f"Sample {idx}: Actual={actual}, Predicted={predicted_class} ({confidence:.0f}%) {status}")
        else:
            print(f"Sample {idx}: Predicted={predicted_class} ({confidence:.0f}%)")
    
    if 'Fault' in test_df.columns:
        accuracy = (correct / total) * 100
        print(f"\nAccuracy: {correct}/{total} = {accuracy:.1f}%")

# MAIN MENU
while True:
    print("SELECT TEST MODE:")
    print("1. Manual Input - Enter sensor values yourself")
    print("2. Quick Test - Test with sample cases from dataset")
    print("3. Batch Test - Test multiple cases from CSV")
    print("4. Exit")
    print()
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == '1':
        manual_input_mode()
    elif choice == '2':
        quick_test_mode()
    elif choice == '3':
        batch_test_mode()
    elif choice == '4':
        break
    else:
        print("Invalid choice. Try again.")
