# Intelligent Engine Failure Detection and Maintenance Management Platform

A comprehensive platform for vehicle diagnostics and maintenance management, featuring AI-powered fault detection from OBD-II sensor data.

## Overview

This platform integrates:
- A React/TypeScript frontend for mechanics and vehicle owners
- A Spring Boot (Java 17) backend with REST API and JWT authentication
- A Python/FastAPI machine learning service for fault prediction
- A PostgreSQL database for persistent storage
- MailHog for email testing in development

The system enables users to:
- Manage vehicles and bookings
- Submit OBD-II readings for AI-assisted fault diagnosis
- View maintenance records and generate PDF reports
- Receive email notifications


## Architecture

```plaintext
+------------------+       +------------------+       +------------------+
|   Frontend       |       |     Backend      |       |   ML Service     |
| (React/TS)       |       | (Spring Boot)    |       | (FastAPI)        |
+--------+---------+       +--------+---------+       +--------+---------+
         ^                       ^                         ^
         |                       |                         |
         | HTTP/REST (JSON)      | HTTP/REST (JSON)        | HTTP/REST (JSON)
         |                       |                         |
+--------v---------+   +--------v---------+   +--------v---------+
|                  |   |                  |   |                  |
|  PostgreSQL DB   |   |   MailHog (SMTP) |   |   ML Models      |
|                  |   |                  |   |                  |
+------------------+   +------------------+   +------------------+
```

## Services

### Frontend
- **Technology**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Features**: 
  - Vehicle and booking management
  - OBD-II data entry form
  - Diagnostic results display
  - Maintenance record management
  - PDF report generation and download
- **Location**: `frontend/`
- **Port**: 5173 (development)

### Backend
- **Technology**: Java 17, Spring Boot 3, Spring Data JPA, Spring Security, JWT
- **Features**:
  - RESTful API secured with JWT
  - Role-based access control (CLIENT/MECHANIC)
  - Vehicle, booking, diagnostic, maintenance, and report management
  - Integration with ML service for fault prediction
  - Email notifications via SMTP
  - PDF report generation (iTextPDF)
- **Location**: `backend/`
- **Port**: 8080

### ML Service
- **Technology**: Python 3.11, FastAPI, TensorFlow/Keras, joblib
- **Features**:
  - Neural network model for fault classification (3 classes)
  - Real-time inference from OBD-II sensor data
  - Feature scaling with StandardScaler
  - Health check endpoint
- **Location**: `ml-service/`
- **Port**: 8001

### Database
- **Technology**: PostgreSQL 15
- **Purpose**: Stores all application data (users, vehicles, bookings, diagnostics, maintenance, reports)
- **Initialization**: Automatic schema creation via Hibernate
- **Port**: 5432 (host) → 5432 (container)

### MailHog
- **Purpose**: Email testing interface for development
- **SMTP Port**: 1025
- **Web UI Port**: 8025
- **Location**: `mailhog` service in docker-compose

## Getting Started

### Prerequisites
- Docker Engine 20.10+
- Docker Compose v2+
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/engine-fault-detection-platform.git
   cd engine-fault-detection-platform
   ```

2. Build and start all services:
   ```bash
   docker-compose up --build
   ```

3. Wait for services to initialize (approximately 30-60 seconds for the first build).

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080/api
   - ML Service: http://localhost:8001
   - API Documentation (Swagger): http://localhost:8001/docs
   - MailHog UI: http://localhost:8025

### Environment Variables

Key environment variables are defined in `docker-compose.yml`:

| Service       | Variable                     | Description                                  | Default                     |
|---------------|------------------------------|----------------------------------------------|-----------------------------|
| backend       | SPRING_DATASOURCE_URL        | PostgreSQL JDBC URL                          | jdbc:postgresql://pfe-postgres:5432/pfe_engine |
| backend       | SPRING_MAIL_HOST             | SMTP host for email                          | mailhog                     |
| backend       | ML_BASE_URL                  | URL of the ML service                        | http://ml-service:8001      |
| backend       | APP_MAIL_FROM                | Sender email address                         | no-reply@pfe.local          |
| pfe-postgres  | POSTGRES_DB                  | Database name                                | pfe_engine                  |
| pfe-postgres  | POSTGRES_USER                | Database username                            | pfe_user                    |
| pfe-postgres  | POSTGRES_PASSWORD            | Database password                            | pfe_pass                    |


## API Documentation

### Backend REST API
All endpoints are endpoints with `/api`. Required JWT authentication (except auth endpoints).

**Authentication**
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

**Vehicles** (Client role)
- `GET /api/vehicles` - List user's vehicles
- `POST /api/vehicles` - Create a vehicle
- `GET /api/vehicles/{id}` - Get vehicle details
- `PUT /api/vehicles/{id}` - Update vehicle
- `DELETE /api/vehicles/{id}` - Delete vehicle

**Bookings** (Client/Mechanic roles)
- `GET /api/bookings/my` - List user's bookings
- `GET /api/bookings/{id}` - Get booking details
- `POST /api/bookings` - Create a booking
- `PUT /api/bookings/{id}/accept` - Mechanic accepts booking
- `PUT /api/bookings/{id}/start` - Mechanic starts work
- `PUT /api/bookings/{id}/complete` - Mechanic completes booking
- `PUT /api/bookings/{id}/cancel` - Cancel booking (non-terminal state)

**Diagnostics** (Assigned Mechanic role)
- `GET /api/diagnostic/booking/{id}` - Retrieve OBD-II data for booking
- `POST /api/diagnostic/booking/{id}` - Submit OBD-II readings (14 values)

**Maintenance** (Assigned Mechanic role)
- `GET /api/maintenance/booking/{id}` - Get maintenance record
- `POST /api/maintenance/booking/{id}` - Save maintenance record

**Reports** (Client/Mechanic role)
- `GET /api/reports/booking/{id}` - Generate PDF report (returns metadata)
- `GET /api/reports/booking/{id}/download` - Download generated PDF

### ML Service API
- `POST /predict` - Predict fault from OBD-II readings
  - **Input**: JSON with 14 numeric fields (see [OBD Feature Order](#obd-feature-order))
  - **Output**: 
    ```json
    {
      "predicted_fault": 0,
      "fault_description": "Normal/Baseline Operation",
      "confidence": 95.5
    }
    ```
- `GET /health` - Health check

### OBD Feature Order

The ML service expects the following 14 features in this exact order:

1. `MAP` - Manifold Absolute Pressure (kPa)

2. `TPS` - Throttle Position Sensor (%)

3. `Force` - Derived mechanical force (N)

4. `Power` - Derived power (kW)

5. `RPM` - Engine revolutions per minute

6. `Consumption L/H` - Fuel consumption (liters/hour)

7. `Consumption L/100KM` - Fuel consumption (liters/100km)

8. `Speed` - Vehicle speed (km/h)

9. `CO` - Carbon monoxide (% volume)

10. `HC` - Hydrocarbon (ppm)

11. `CO2` - Carbon dioxide (% volume)

12. `O2` - Oxygen (% volume)

13. `Lambda` - Air-fuel equivalence ratio (dimensionless)

14. `AFR` - Air-fuel ratio by mass (dimensionless)

### Development

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
./mvnw spring-boot:run
```

#### ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn simple_api:app --host 0.0.0.0 --port 8001
```

### Testing

#### Backend
```bash
cd backend
./mvnw test
```

#### ML Service
```bash
cd ml-service
python -m pytest tests/ -v
```

### Production Deployment

For production, consider:
1. Using a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Configuring a proper SMTP service (SendGrid, AWS SES, etc.)
3. Setting up SSL/TLS termination at the ingress layer
4. Using Kubernetes or Docker Swarm for orchestration
5. Implementing proper secrets management (HashiCorp Vault, AWS Secrets Manager)
6. Configuring resource limits and health checks in Docker/Kubernetes
7. Setting up logging and monitoring (ELK stack, Prometheus/Grafana)

### Model Information

The ML model is a feed-forward neural network trained on the EngineFaultDB dataset:
- **Architecture**: 5 dense layers (128→64→64→32→16→3) with ReLU, BatchNorm, and Dropout
- **Input**: 14 OBD-II sensor features
- **Output**: 3 fault classes (Normal/Baseline Operation, Rich Mixture Problems, Combustion Efficiency Problems)
- **Training**: Adam optimizer, Sparse Categorical Crossentropy loss, 30 epochs, batch size 256
- **Performance** (on academic benchmark): 100% accuracy, macro F1-score 1.0
  > **Note**: These results are on a clean academic dataset. Real-world performance may vary due to sensor noise, drift, and environmental factors. Validation with real OBD-II data is recommended before production deployment.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgments

- Built with React, TypeScript, Spring Boot, FastAPI, and PostgreSQL
- Inspired by real-world challenges in preventive maintenance and automotive diagnostics
- OBD-II parameter definitions based on SAE J1979 standard
- EngineFaultDB dataset: https://github.com/leoxthomas/EngineFaultDB

---
*Last updated: June 2024*


## 📱 Mobile Application (React Native)

A React Native application is included in the `mobile/` directory. This application consumes the same backend APIs as the web frontend, providing a native mobile experience for mechanics and vehicle owners.

### Features

- Vehicle and booking management optimized for touch
- OBD-II data entry with numeric keyboards and voice input support
- Offline-first capability for areas with poor connectivity
- Secure JWT storage using Expo's secure store
- Push notifications for service reminders
- PDF report viewing and sharing

### Technology Stack

- React Native with TypeScript
- React Navigation for screen routing
- React Native Paper for Material Design UI
- Expo for development and build services
- Axios for API communication
- AsyncStorage + Expo Secure Store for local data

### Getting Started

#### Prerequisites

- Node.js (v14 or later)
- npm or Yarn
- Expo CLI (installed globally or via npx)
- Android Studio / Xcode (for emulators/simulators) or a physical device with Expo Go app

#### Backend Setup

First, ensure the backend services are running. From the repository root:

```bash
# Start the backend, ML service, database, and MailHog
docker-compose up backend ml-service pfe-postgres mailhog
```

This will start:
- Backend API at http://localhost:8080
- ML Service at http://localhost:8001
- PostgreSQL at http://localhost:5433
- MailHog UI at http://localhost:8025

#### Mobile App Setup

1. Navigate to the mobile directory and install dependencies:

```bash
cd mobile
npm install
```

2. Configure the API endpoint by creating a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api
```

**Note**: 
- Use `10.0.2.2` for Android emulator
- Use `localhost` for iOS simulator
- Use your machine's IP address (e.g., `192.168.1.100:8080/api`) for physical devices on the same network

3. Start the Metro bundler:

```bash
npm start
```

4. In the Expo DevTools that opens in your browser:
   - Press `a` to launch on Android emulator
   - Press `i` to launch on iOS simulator
   - Scan the QR code with the Expo Go app on a physical device

### Development Workflow

With both the backend and mobile app running:
1. Make changes to the backend in the `backend/` directory
2. Restart the affected Docker container (or restart `docker-compose up`) to apply changes
3. The mobile app will automatically pick up the updated API since it points to the same backend

### Project Structure

```
mobile/
├── src/
│   ├── api/          # API service adapters (auth, vehicles, bookings, etc.)
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks (e.g., useAuth)
│   ├── navigation/   # React Navigation configuration
│   ├── screens/      # Screen components (Login, Home, etc.)
│   ├── types/        # Shared TypeScript interfaces (copied from frontend)
│   └── utils/        # Utility functions (storage, theme, etc.)
├── App.tsx           # Root component
├── app.json          # Expo configuration
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

### Notes for Development

- The mobile app is intentionally kept separate from the web frontend (`frontend/`) to avoid any dependency conflicts.
- Changes to the backend or API contracts will automatically be available to both web and mobile clients.
- For production builds, use `expo build:android` and `expo build:ios` after configuring your Expo account.
- When testing on a physical device, ensure your mobile device is on the same network as your development machine and that the device can reach your machine's IP address on port 8080.

### Available Scripts in `mobile/`

In the `mobile/` directory, you can run:

| Script | Description |
|--------|-------------|
| `npm start` | Start the Metro bundler (Expo DevTools) |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS device/simulator (macOS only) |
| `npm run web` | Run in web browser (experimental) |
| `npm test` | Run Jest tests (if any) |

---

