# Intelligent Engine Failure Detection and Maintenance Management Platform

## Overview

This platform delivers an end-to-end, data-driven solution for intelligent engine failure detection and maintenance optimization. By leveraging On-Board Diagnostics (OBD) data and advanced deep learning, it predicts abnormal engine behaviors and potential faults, helping vehicle operators minimize downtime and maintenance costs.

The system is designed for extensibility, with both a Python-based machine learning workflow (including Jupyter Notebooks) and a scalable Java backend (Spring Boot). It features a modular architecture for research, prototyping, and production deployment scenarios.

---

## Features

- **Deep Learning-Based Fault Detection:** Neural networks and feature engineering to model complex engine behavior from OBD sensor data.
- **Robust Data Pipeline:** Tools for data ingestion, preprocessing, and clean dataset curation.
- **Real-Time Inference API:** FastAPI service exposing ML models for instant predictions.
- **Scalable Backend:** Spring Boot (Java) microservice ready for enterprise deployment and integration.
- **Testing Suite:** Automated unit and integration tests to ensure reliability.
- **Manual & Automated Evaluation:** Jupyter notebooks and test scripts for thorough analysis.
- **Easy Deployment:** Docker and Docker Compose for simple, reproducible setup.
- **Documentation:** Comprehensive references for both data science and backend components.

---

## Project Structure

```
├── src/                   # Main Python source code
│   └── api/               # FastAPI web service
├── backend/               # Java Spring Boot backend (REST API, integration logic)
├── data/                  # OBD dataset(s)
├── models/                # Machine learning models & preprocessors
├── notebooks/             # Jupyter Notebooks (EDA, modeling, results)
├── tests/                 # Python testing scripts
├── requirements.txt       # Python requirements
├── pom.xml                # Maven configuration for Java backend
├── docker-compose.yml     # Docker Compose for orchestrating stack
├── LICENSE                # Project license
├── README.md              # Project documentation (this file)
├── HELP.md                # Backend usage/help documentation
├── PFE_Report.pdf         # Full technical report/documentation
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- Java 17+ (for backend, see HELP.md for supported versions)
- Docker & Docker Compose (optional, for full stack deployment)

### 1. Python Machine Learning Service

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run FastAPI server:**
```bash
python src/api/simple_api.py
```

Service will be available at: [http://localhost:8001](http://localhost:8001)

### 2. Java Backend (Spring Boot)

See `HELP.md` and `pom.xml` for how to build and run the backend as a standalone microservice:

```bash
./mvnw spring-boot:run
```

### 3. Dockerized Full Stack

To launch the stack (requires Docker Compose):
```bash
docker-compose up
```

---

## Usage

### REST API Endpoints

The Python FastAPI backend exposes endpoints for real-time predictions using OBD sensor data. Example usage:

- **POST** `/predict`  
  Submits current sensor readings; returns predicted state and recommended action.

See code and FastAPI docs for specific payloads and outputs.

---

## Data & Models

- **data/EngineFaultDB_Final.csv** – Main dataset (OBD records, labeled for supervised learning)
- **models/engine_fault_nn_model.keras** – Trained fault detection neural network
- **models/feature_scaler.pkl** – Input scaler (required for correct model inference)

---

## Notebooks & Experiments

- Jupyter notebooks in `notebooks/` demonstrate:
  - Exploratory Data Analysis (EDA)
  - Preprocessing & Feature Engineering
  - Model Training & Evaluation
  - Visualization of results

---

## Testing

- **Automated Testing:**  
  `tests/simple_test.py` – API endpoint validation  
  `tests/manual_prediction_tester.py` – Manually test edge cases, investigate model outputs

### Unified Evaluation Sheet (Data + Model + API + Backend)

Use the evaluation script to compute metrics and generate one consolidated sheet:

```bash
python3 tests/evaluate_metrics.py
```

Outputs:
- `tests/evaluation_sheet.csv`
- `tests/evaluation_sheet.md`

To include runtime API metrics (`/health`, `/predict`), start FastAPI first and run:

```bash
python3 tests/evaluate_metrics.py --run-api --api-base-url http://localhost:8001 --api-requests 50
```

To include backend diagnostic endpoint metrics, start Spring backend and provide auth context:

```bash
python3 tests/evaluate_metrics.py \
  --run-backend \
  --backend-base-url http://localhost:8080 \
  --backend-booking-id <BOOKING_ID> \
  --backend-token <JWT_TOKEN> \
  --backend-requests 50
```

Optional system resource metrics can be added from a CSV:

```bash
python3 tests/evaluate_metrics.py --system-metrics-csv /absolute/path/to/system_metrics.csv
```

---

## Documentation & References

- **HELP.md:**  
  Step-by-step backend and Maven/Spring help, with relevant official links.
- **PFE_Report.pdf:**  
  Detailed report including methodology, model selection, experiments, and results.
- **Backend Documentation:**  
  Generated JavaDoc and reference links for extending backend services.

---

## Contributing

Contributions are welcome! Please open issues for bug reports, feature requests, or improvement suggestions. See the LICENSE file for usage permissions.

---

## License

This project is licensed under the MIT License. See the [`LICENSE`](./LICENSE) file for details.

---

## Acknowledgements

- Built with Python, FastAPI, Jupyter, Java Spring Boot, and Maven.
- Inspired by real-world challenges in predictive maintenance and automotive diagnostics.
- For further resources and Spring Boot best practices, check links included in [HELP.md](./HELP.md).

---
