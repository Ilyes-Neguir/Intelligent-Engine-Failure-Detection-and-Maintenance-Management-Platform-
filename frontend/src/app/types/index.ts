export type UserRole = 'CLIENT' | 'MECHANIC';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Returned by POST /auth/login — includes JWT token */
export interface AuthUser {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

/** Returned by POST /auth/register — NO token, redirect to login */
export interface RegisterResponse {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserRef {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
// Matches VehicleResponseDTO from backend controller

export interface Vehicle {
  id: number;
  ownerId: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate?: string;
  engineType?: string;
  mileage?: number;
}

// ─── Booking ─────────────────────────────────────────────────────────────────
// Matches BookingResponseDTO from backend controller.
// Backend returns IDs (clientId, mechanicId, vehicleId).
// Nested objects (vehicle, client, mechanic) may optionally be enriched
// by the backend projection — always use optional chaining when accessing them.

export interface Booking {
  id: number;
  clientId: number;
  mechanicId?: number | null;
  vehicleId: number;
  scheduledTime: string;
  status: BookingStatus;
  description?: string;
  mechanicNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Optionally enriched by backend (not guaranteed — use ?. access)
  vehicle?: Vehicle;
  client?: UserRef;
  mechanic?: UserRef | null;
}

// ─── OBD / Diagnostics ───────────────────────────────────────────────────────
// Field names MUST match backend DTO exactly:
// map, tps, force, power, rpm, consumptionlh, consumptionl100km,
// speed, co, hc, co2, o2, lambda, afr

export interface OBDData {
  id: number;
  bookingId: number;
  // 14 OBD sensor fields (backend DTO names)
  map: number;
  tps: number;
  force: number;
  power: number;
  rpm: number;
  consumptionlh: number;
  consumptionl100km: number;
  speed: number;
  co: number;
  hc: number;
  co2: number;
  o2: number;
  lambda: number;
  afr: number;
  // ML prediction output
  predicted_fault: string;
  confidence_score: number;
  created_at?: string;
  createdAt?: string;
}

// ─── Report ──────────────────────────────────────────────────────────────────

export interface Report {
  id: number;
  bookingId?: number;
  booking?: { id: number };
  filePath?: string;
  fileName: string;
  created_at?: string;
  createdAt?: string;
}

// ─── Error ───────────────────────────────────────────────────────────────────
// Supports both Spring Boot default format and custom error format from backend

export interface ApiErrorData {
  // Spring Boot default
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  errors?: Record<string, string>;
  // Custom structured error format
  errorCode?: string;
  entity?: string;
  action?: string;
  details?: string;
  path?: string;
}
