# Frontend Design Specification: Intelligent Engine Failure Detection Platform

## PROJECT OVERVIEW

A diagnostic platform where mechanics analyze vehicle engine health using OBD (On-Board Diagnostics) sensor data. The system integrates a trained neural network that classifies engine faults based on 14 sensor parameters. Users interact through a booking system where clients schedule diagnostics and mechanics execute them with AI-assisted fault detection.

**Core Architecture:**
- Spring Boot Backend (Port 8080) - Business logic, authentication, data persistence
- FastAPI ML Service (Port 8001) - Neural network model serving
- PostgreSQL Database (Port 5433) - Data storage
- Frontend (To be built) - User interfaces for CLIENT and MECHANIC roles

**Critical Constraint:** This frontend must ONLY implement features that exist in the backend code. No invented dashboards, analytics, or capabilities beyond what the API provides.

---

## USER ROLES & AUTHENTICATION

### Two Distinct User Types

**CLIENT** - Vehicle owners who:
- Register vehicles
- Create diagnostic bookings
- View diagnostic results
- Download reports

**MECHANIC** - Service providers who:
- Accept pending bookings
- Execute diagnostic sessions
- Input OBD sensor data
- Receive AI-powered fault classifications
- Generate PDF reports

### Authentication Flow
- JWT-based authentication
- Registration requires: name, email, password, phone, role (CLIENT/MECHANIC)
- Login returns: JWT token, user_id, name, email, role
- Token must be included in Authorization header: `Bearer {token}`

---

## BACKEND API ENDPOINTS

### Authentication (`/api/auth`)
```
POST /api/auth/register
  Body: { name, email, password, phone, role }
  Returns: { token, userId, name, email, role }

POST /api/auth/login
  Body: { email, password }
  Returns: { token, userId, name, email, role }
```

### Vehicles (`/api/vehicles`) - Requires CLIENT or MECHANIC auth
```
POST /api/vehicles/user/{userId}
  Body: { make, model, year, vin, licensePlate?, engineType?, mileage? }
  Returns: Vehicle object

GET /api/vehicles/user/{userId}
  Returns: Array of user's vehicles

GET /api/vehicles/{id}
  Returns: Single vehicle

PUT /api/vehicles/{id}/user/{userId}
  Body: { make, model, year, licensePlate?, engineType?, mileage? }
  Returns: Updated vehicle

DELETE /api/vehicles/{id}/user/{userId}
  Returns: 204 No Content
```

### Bookings (`/api/bookings`) - Requires CLIENT or MECHANIC auth
```
POST /api/bookings/user/{userId}
  Body: { vehicleId, scheduledTime (ISO-8601), description? }
  Returns: Booking object with status PENDING

GET /api/bookings/user/{userId}
  Returns: Array of user's bookings

GET /api/bookings/{id}
  Returns: Single booking with full details

POST /api/bookings/{id}/accept/mechanic/{mechanicId}
  MECHANIC only - Assigns mechanic to booking
  Returns: Booking with status CONFIRMED

POST /api/bookings/{id}/start/mechanic/{mechanicId}
  MECHANIC only - Changes status to IN_PROGRESS
  Returns: Updated booking

POST /api/bookings/{id}/complete/mechanic/{mechanicId}
  MECHANIC only
  Body: { notes }
  Returns: Booking with status COMPLETED

POST /api/bookings/{id}/cancel/user/{userId}
  Changes status to CANCELED
  Returns: Updated booking
```

**Booking Status Flow:**
PENDING → (mechanic accepts) → CONFIRMED → (mechanic starts) → IN_PROGRESS → (mechanic completes) → COMPLETED
Any status can transition to CANCELED

### Diagnostics (`/api/diagnostic`) - MECHANIC only
```
POST /api/diagnostic/booking/{bookingId}
  Body: {
    mapSensor, tpsSensor, rpm, afr, lambda, co, hc, 
    co2, o2, engineCoolantTemp, intakeAirTemp, 
    fuelPressure, timingAdvance, mafSensor
  }
  All 14 fields required (Double values)
  
  Process:
  1. Validates booking is CONFIRMED or IN_PROGRESS
  2. Calls ML service with sensor array
  3. Stores OBD data + prediction results
  
  Returns: OBDData object with predicted_fault and confidence_score

GET /api/diagnostic/booking/{bookingId}
  Returns: OBD data including ML prediction
```

### Reports (`/api/reports`) - CLIENT or MECHANIC
```
POST /api/reports/booking/{bookingId}
  Generates PDF report
  Returns: Report object with file metadata

GET /api/reports/booking/{bookingId}
  Returns: Report metadata

GET /api/reports/download/{reportId}
  Returns: PDF file download
```

### ML Direct Access (`/api/ml`) - For testing/demonstration
```
GET /api/ml/test-connection
  Tests FastAPI service connectivity
  Returns: String confirmation

POST /api/ml/predict
  Body: {
    map, tps, force, power, rpm, consumptionlh,
    consumptionl100km, speed, co, hc, co2, o2,
    lambda_, afr
  }
  Returns: {
    predicted_fault (0-3),
    fault_description,
    confidence (0-1)
  }
```

---

## MACHINE LEARNING INTEGRATION

### Neural Network Model Details
- **Input:** 14 OBD sensor parameters (numeric array)
- **Output:** Fault classification + confidence score
- **Classes (4 categories, but 2+3 merged in practice):**
  - Class 0: "No Fault"
  - Class 1: "Ignition Fault"
  - Class 2/3 (merged): "Fuel System Fault" / "Emission Control Fault"
  
  *(Note: Original dataset had 4 classes, but Faults 2 and 3 were merged due to near-identical sensor signatures with <6% parameter difference)*

### 14 OBD Parameters Explained

**Air/Fuel Mixture:**
1. **AFR** (Air-Fuel Ratio) - Ratio of air to fuel in combustion chamber
2. **Lambda** - Normalized AFR (1.0 = stoichiometric)
3. **MAF Sensor** - Mass Air Flow sensor reading (g/s)
4. **MAP Sensor** - Manifold Absolute Pressure (kPa)
5. **TPS Sensor** - Throttle Position Sensor (% opening)

**Combustion Products:**
6. **CO** - Carbon Monoxide emission (%)
7. **HC** - Hydrocarbon emission (ppm)
8. **CO2** - Carbon Dioxide emission (%)
9. **O2** - Oxygen level in exhaust (%)

**Engine Operating State:**
10. **RPM** - Engine revolutions per minute
11. **Engine Coolant Temp** - Coolant temperature (°C)
12. **Intake Air Temp** - Intake manifold air temperature (°C)

**Fuel System:**
13. **Fuel Pressure** - Fuel rail pressure (kPa)
14. **Timing Advance** - Ignition timing advance (degrees)

### Prediction Process
1. Mechanic enters 14 sensor values via form
2. System packages values into array
3. FastAPI service runs neural network inference
4. Returns fault class (0-3) with confidence score (0-1)
5. Backend maps class to human-readable fault description
6. Results stored in database linked to booking

---

## DATA MODELS

### User
```
{
  id: Long,
  name: String,
  email: String (unique),
  phone: String,
  role: "CLIENT" | "MECHANIC",
  created_at: DateTime
}
```

### Vehicle
```
{
  id: Long,
  owner: User,
  make: String (e.g., "Toyota"),
  model: String (e.g., "Camry"),
  year: Integer,
  vin: String (unique),
  licensePlate: String,
  engineType: String,
  mileage: Integer,
  created_at: DateTime
}
```

### Booking
```
{
  id: Long,
  client: User,
  mechanic: User | null,
  vehicle: Vehicle,
  scheduledTime: DateTime,
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED",
  description: String,
  mechanicNotes: String | null,
  created_at: DateTime,
  updated_at: DateTime
}
```

### OBDData
```
{
  id: Long,
  booking: Booking,
  mapSensor: Double,
  tpsSensor: Double,
  rpm: Double,
  afr: Double,
  lambda: Double,
  co: Double,
  hc: Double,
  co2: Double,
  o2: Double,
  engineCoolantTemp: Double,
  intakeAirTemp: Double,
  fuelPressure: Double,
  timingAdvance: Double,
  mafSensor: Double,
  predicted_fault: String,     // ML result
  confidence_score: Double,     // ML confidence (0-1)
  created_at: DateTime
}
```

### Report
```
{
  id: Long,
  booking: Booking,
  filePath: String,
  fileName: String,
  created_at: DateTime
}
```

---

## REQUIRED FRONTEND VIEWS

### For CLIENT Role

**1. Authentication**
- Registration form (name, email, password, phone, role=CLIENT)
- Login form

**2. My Vehicles Dashboard**
- List of registered vehicles (make, model, year, VIN, license plate)
- Add new vehicle button → form
- Edit/Delete actions per vehicle

**3. Bookings Management**
- Create booking: select vehicle, date/time picker, description textarea
- View my bookings table with columns:
  - Booking ID
  - Vehicle (make/model)
  - Scheduled time
  - Status badge (color-coded)
  - Assigned mechanic (if CONFIRMED/IN_PROGRESS/COMPLETED)
  - Actions: View details, Cancel (if not COMPLETED)

**4. Booking Detail View**
- Booking metadata (vehicle, time, status, description)
- Mechanic notes (if completed)
- Diagnostic results section (if diagnostic data exists):
  - Predicted fault type with visual indicator
  - Confidence score with percentage bar
  - All 14 OBD parameter values in readable format
- Download report button (if report exists)

### For MECHANIC Role

**1. Authentication**
- Registration/Login (role=MECHANIC)

**2. Pending Bookings Queue**
- Table of PENDING status bookings:
  - Client name
  - Vehicle details
  - Scheduled time
  - Description preview
  - Accept button → assigns mechanic and changes to CONFIRMED

**3. My Active Bookings**
- Filter/tabs: CONFIRMED, IN_PROGRESS, COMPLETED
- Each booking shows:
  - Client/vehicle info
  - Scheduled time
  - Current status
  - Actions based on status:
    - CONFIRMED: "Start Diagnostic" button
    - IN_PROGRESS: "Enter OBD Data" button
    - COMPLETED: View results, Generate report

**4. OBD Data Entry Form** (Critical UI)
- Triggered when mechanic clicks "Enter OBD Data" on IN_PROGRESS booking
- 14 input fields with labels and units:
  ```
  Air & Fuel Section:
  - MAP Sensor (kPa)
  - TPS Sensor (%)
  - MAF Sensor (g/s)
  - AFR (ratio)
  - Lambda (ratio)
  
  Emissions Section:
  - CO (%)
  - HC (ppm)
  - CO2 (%)
  - O2 (%)
  
  Engine State Section:
  - RPM
  - Engine Coolant Temp (°C)
  - Intake Air Temp (°C)
  
  Fuel System Section:
  - Fuel Pressure (kPa)
  - Timing Advance (degrees)
  ```
- Submit button triggers ML prediction
- Loading state while calling backend
- Results display:
  - Fault classification (bold, color-coded)
  - Confidence percentage with visual bar
  - Green if No Fault, Yellow/Orange for warnings, Red for critical
  - Explanation of fault type

**5. Complete Booking Flow**
- After diagnostic entry, show:
  - Diagnostic results summary
  - Mechanic notes textarea (required)
  - "Complete Booking" button
- Transition to COMPLETED status

**6. Report Generation**
- On completed booking detail page
- "Generate Report" button → creates PDF
- "Download Report" link after generation

### Shared/Common Components

**Navigation Bar:**
- Logo/app name
- User name + role badge
- Logout button
- Navigation links based on role:
  - CLIENT: Vehicles, Bookings
  - MECHANIC: Pending Bookings, My Bookings

**Status Badges:**
- PENDING: Gray
- CONFIRMED: Blue
- IN_PROGRESS: Orange
- COMPLETED: Green
- CANCELED: Red

**Error Handling:**
- Display API validation errors under form fields
- Toast notifications for success/error messages
- 401 Unauthorized → redirect to login
- 403 Forbidden → show permission error

---

## UI/UX REQUIREMENTS

### Design Principles
- **Professional, clinical aesthetic** - This is a diagnostic tool, not consumer app
- Clear visual hierarchy for critical information (fault predictions)
- Responsive design (desktop primary, tablet/mobile secondary)
- Accessibility: proper labels, color contrast, keyboard navigation

### Key Interactions

**OBD Data Entry:**
- Group related parameters visually
- Include parameter units in labels
- Real-time validation (numeric, positive values)
- Clear "Submit for Analysis" button
- Prominent results display after submission

**Booking Status Visualization:**
- Timeline/stepper showing: Created → Confirmed → In Progress → Completed
- Visual indicators for current state
- Disabled future states

**ML Prediction Results:**
- Large, clear fault classification text
- Confidence score as percentage + progress bar
- Color coding: Green (>80% No Fault), Yellow (60-80%), Red (<60% or Fault detected)
- Expandable section showing all 14 input parameters with values

### Data Tables
- Sortable columns (date, status)
- Search/filter by vehicle, date range, status
- Pagination if >20 records
- Click row to view details

---

## TECHNICAL CONSTRAINTS

### API Communication
- Base URL: `http://localhost:8080/api`
- All requests except auth require `Authorization: Bearer {token}` header
- Content-Type: `application/json`
- Date/time format: ISO-8601 (e.g., "2026-05-15T14:30:00")

### Error Response Format
```json
{
  "timestamp": "2026-04-13T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Specific error message",
  "errors": {  // for validation errors
    "field_name": "Field error message"
  }
}
```

### Security Rules
- CLIENT can only access own vehicles and bookings
- MECHANIC can accept any PENDING booking
- MECHANIC can only complete bookings assigned to them
- Diagnostic endpoint requires MECHANIC role
- Report download requires ownership (client or assigned mechanic)

---

## IMPLEMENTATION PRIORITIES

### Phase 1 - Core Workflow
1. Authentication (login/register)
2. CLIENT vehicle management
3. CLIENT booking creation
4. MECHANIC booking acceptance
5. MECHANIC OBD data entry + prediction display

### Phase 2 - Complete Features
6. Booking lifecycle (start, complete, cancel)
7. Diagnostic results viewing
8. Report generation/download

### Phase 3 - Polish
9. Dashboard summaries
10. Search/filter improvements
11. Mobile responsiveness

---

## SAMPLE USER FLOWS

### CLIENT Flow: Schedule Diagnostic
1. Login as CLIENT
2. Navigate to Vehicles → Add vehicle (if none exist)
3. Navigate to Bookings → Create Booking
4. Select vehicle from dropdown
5. Pick date/time (future datetime)
6. Add description: "Check engine light on, rough idle"
7. Submit → Booking created with PENDING status
8. Wait for mechanic acceptance (status → CONFIRMED)
9. After completion, view diagnostic results
10. Download PDF report

### MECHANIC Flow: Execute Diagnostic
1. Login as MECHANIC
2. View Pending Bookings queue
3. Review booking details (vehicle: 2018 Honda Civic, symptoms: rough idle)
4. Click "Accept" → Status CONFIRMED
5. At scheduled time, click "Start Diagnostic"
6. Enter 14 OBD parameters from diagnostic tool:
   - MAP: 45.2 kPa
   - TPS: 15.8%
   - RPM: 3200
   - AFR: 14.2
   - Lambda: 0.97
   - CO: 0.8%
   - HC: 120 ppm
   - CO2: 13.5%
   - O2: 1.2%
   - Coolant Temp: 88°C
   - Intake Temp: 35°C
   - Fuel Pressure: 380 kPa
   - Timing Advance: 12°
   - MAF: 18.5 g/s
7. Click "Submit for Analysis"
8. System calls ML service, displays prediction:
   - **Fault: Ignition Fault**
   - **Confidence: 87.3%**
9. Add mechanic notes: "Spark plugs worn, recommended replacement"
10. Click "Complete Booking"
11. Generate report → Download PDF

---

## FIGMA DESIGN DELIVERABLES

### Required Screens (Desktop)
1. Login/Register
2. CLIENT - Vehicle List
3. CLIENT - Add/Edit Vehicle Modal
4. CLIENT - Booking List
5. CLIENT - Create Booking Modal
6. CLIENT - Booking Detail (with diagnostic results)
7. MECHANIC - Pending Bookings Queue
8. MECHANIC - My Bookings (tabs: Confirmed, In Progress, Completed)
9. MECHANIC - OBD Data Entry Form
10. MECHANIC - Prediction Results Display
11. MECHANIC - Complete Booking Form
12. Shared - Navigation Bar
13. Shared - Status Badges Component
14. Shared - Error/Success Toast

### Component Library
- Buttons (primary, secondary, danger)
- Form inputs (text, number, datetime, select, textarea)
- Data tables (with sort, pagination)
- Modals/dialogs
- Status badges
- Loading spinners
- Progress bars (for confidence scores)
- Alert banners

### Color Palette (Suggested)
- Primary: Medical blue (#1976D2)
- Success/No Fault: Green (#4CAF50)
- Warning: Orange (#FF9800)
- Error/Fault: Red (#F44336)
- Neutral: Grays (#212121, #757575, #E0E0E0)
- Background: White (#FFFFFF) / Light gray (#F5F5F5)

### Typography
- Headers: Sans-serif, bold, 24-32px
- Body: Sans-serif, regular, 14-16px
- Labels: Sans-serif, medium, 12-14px
- Code/Data: Monospace for numeric values

---

## VALIDATION RULES

### Vehicle Form
- Make: required, 2-50 chars
- Model: required, 2-50 chars
- Year: required, 1900-current year
- VIN: required, 17 alphanumeric chars, unique
- License Plate: optional
- Engine Type: optional
- Mileage: optional, positive integer

### Booking Form
- Vehicle: required, select from user's vehicles
- Scheduled Time: required, future datetime
- Description: optional, max 1000 chars

### OBD Data Form
- All 14 fields required
- All fields must be numeric (Double)
- Positive values (except timing advance can be negative)
- Reasonable ranges (e.g., RPM: 500-8000, Temp: -20 to 150°C)

### Complete Booking Form
- Mechanic notes: optional, max 2000 chars

---

## ADDITIONAL NOTES

**What This System IS:**
- A diagnostic platform integrating neural network fault detection
- A booking system connecting clients with mechanics
- An OBD data collection and analysis tool
- A report generation system for diagnostic results

**What This System IS NOT:**
- A full garage management platform
- A parts inventory system
- A payment processing system
- A customer relationship management (CRM) tool
- An appointment scheduling system with calendar views
- A real-time vehicle telemetry dashboard

**Design Guidance:**
The interface should emphasize the ML prediction results as the core value proposition. When a mechanic completes the diagnostic form, the fault prediction should be the hero element - large, clear, and immediately actionable. The rest of the UI supports this workflow but should not overshadow the primary function: AI-assisted engine fault detection.

**Backend Ready:**
All endpoints are implemented and tested. The frontend only needs to consume existing APIs - no backend modifications required unless integration testing reveals issues.