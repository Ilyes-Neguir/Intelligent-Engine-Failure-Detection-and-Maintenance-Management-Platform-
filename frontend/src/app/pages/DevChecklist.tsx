/**
 * Developer Handoff Checklist — Engine Fault Detection Platform
 * This file documents all confirmed backend contracts and known fix history.
 * Access at /dev/checklist (remove this route in production).
 */

import { CheckCircle, XCircle, AlertTriangle, Code, Server, Shield } from 'lucide-react';

interface CheckItem {
  id: string;
  category: string;
  issue: string;
  fix: string;
  status: 'fixed' | 'warning' | 'info';
}

const CHECKLIST: CheckItem[] = [
  {
    id: 'A',
    category: 'Error A — Blank Page',
    issue: 'Opened index.html directly via file path',
    fix: 'Run with Vite dev server: npm install && npm run dev → open http://localhost:5173',
    status: 'fixed',
  },
  {
    id: 'B',
    category: 'Error B — CORS 403',
    issue: 'Backend CORS only allowed http://localhost:3000',
    fix: 'Backend must allow http://localhost:5173, OPTIONS method, and preflight in SecurityConfig',
    status: 'warning',
  },
  {
    id: 'C',
    category: 'Error C — Wrong Vehicle Routes',
    issue: 'Frontend called /api/vehicles/user/{id}',
    fix: 'Fixed to: GET /vehicles/my · POST /vehicles · PUT /vehicles/{id} · DELETE /vehicles/{id}',
    status: 'fixed',
  },
  {
    id: 'D',
    category: 'Error D — Auth Contract Mismatch',
    issue: 'Register assumed token in response; navigated to dashboard after register',
    fix: 'Register → /login redirect. Login is the only token source. Correct endpoints used.',
    status: 'fixed',
  },
  {
    id: 'E',
    category: 'Error E — 500 on POST /vehicles',
    issue: 'Intermittent 500 from backend. Form data was lost on error.',
    fix: 'Form state preserved on all 5xx errors. NetworkError vs ApiError distinguished. Dev logging enabled.',
    status: 'warning',
  },
  {
    id: 'OBD',
    category: 'OBD Field Names',
    issue: 'Frontend used mapSensor, tpsSensor, mafSensor, engineCoolantTemp, etc.',
    fix: 'Fixed to exact backend DTO names: map, tps, force, power, rpm, consumptionlh, consumptionl100km, speed, co, hc, co2, o2, lambda, afr',
    status: 'fixed',
  },
  {
    id: 'BOOK',
    category: 'Booking Endpoints',
    issue: 'All booking routes had userId/mechanicId in the path',
    fix: 'Fixed: /bookings/my · /bookings · /bookings/{id}/accept|start|complete|cancel (JWT-identity-based)',
    status: 'fixed',
  },
  {
    id: 'TYPE',
    category: 'Booking DTO Type',
    issue: 'Frontend assumed nested client/vehicle objects; backend returns IDs',
    fix: 'Types updated: clientId, mechanicId, vehicleId as primary. Nested objects optional. Pages use fallbacks.',
    status: 'fixed',
  },
  {
    id: 'DATE',
    category: 'Date Field Names',
    issue: 'Frontend used created_at / updated_at; backend DTO uses createdAt / updatedAt',
    fix: 'Updated to createdAt/updatedAt with fallback support for both formats',
    status: 'fixed',
  },
];

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/register', note: 'Returns {userId, name, email, role} — NO token', auth: false },
  { method: 'POST', path: '/api/auth/login', note: 'Returns {token, userId, name, email, role}', auth: false },
  { method: 'GET', path: '/api/vehicles/my', note: 'Authenticated user\'s vehicles', auth: true },
  { method: 'GET', path: '/api/vehicles/{id}', note: 'Single vehicle by ID', auth: true },
  { method: 'POST', path: '/api/vehicles', note: 'Create vehicle', auth: true },
  { method: 'PUT', path: '/api/vehicles/{id}', note: 'Update vehicle', auth: true },
  { method: 'DELETE', path: '/api/vehicles/{id}', note: 'Delete vehicle', auth: true },
  { method: 'GET', path: '/api/bookings/my', note: 'Bookings for authenticated user', auth: true },
  { method: 'GET', path: '/api/bookings/{id}', note: 'Single booking by ID', auth: true },
  { method: 'POST', path: '/api/bookings', note: 'Create booking (CLIENT)', auth: true },
  { method: 'POST', path: '/api/bookings/{id}/accept', note: 'Accept booking (MECHANIC)', auth: true },
  { method: 'POST', path: '/api/bookings/{id}/start', note: 'Start diagnostic (MECHANIC)', auth: true },
  { method: 'POST', path: '/api/bookings/{id}/complete', note: 'Complete booking — body: {notes} (MECHANIC)', auth: true },
  { method: 'POST', path: '/api/bookings/{id}/cancel', note: 'Cancel booking (CLIENT)', auth: true },
  { method: 'POST', path: '/api/diagnostic/booking/{id}', note: 'Submit OBD data for AI analysis', auth: true },
  { method: 'GET', path: '/api/diagnostic/booking/{id}', note: 'Get OBD results for booking', auth: true },
  { method: 'POST', path: '/api/reports/booking/{id}', note: 'Generate PDF report', auth: true },
  { method: 'GET', path: '/api/reports/booking/{id}', note: 'Get report metadata', auth: true },
  { method: 'GET', path: '/api/reports/download/{id}', note: 'Download PDF blob', auth: true },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

export function DevChecklist() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
          <Code className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-slate-800">Developer Handoff Checklist</h1>
          <p className="text-sm text-slate-500">Engine Fault Detection Platform — Backend Integration Reference</p>
        </div>
        <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          DEV ONLY — remove in production
        </span>
      </div>

      {/* Fix History */}
      <section className="mb-8">
        <h2 className="text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Integration Fix History
        </h2>
        <div className="space-y-3">
          {CHECKLIST.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {item.status === 'fixed'
                  ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  : item.status === 'warning'
                    ? <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    : <XCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{item.id}</span>
                    <p className="text-sm font-semibold text-slate-700">{item.category}</p>
                  </div>
                  <p className="text-xs text-red-600 mb-1">
                    <span className="font-medium">Issue:</span> {item.issue}
                  </p>
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Fix:</span> {item.fix}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Confirmed Endpoints */}
      <section className="mb-8">
        <h2 className="text-slate-800 mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-500" />
          Confirmed Backend Endpoints
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Path</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Auth</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ENDPOINTS.map((ep, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-mono font-semibold ${METHOD_COLORS[ep.method] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-slate-700">{ep.path}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {ep.auth
                      ? <Shield className="h-4 w-4 text-blue-500" />
                      : <span className="text-xs text-slate-400">Public</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{ep.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* OBD Fields */}
      <section className="mb-8">
        <h2 className="text-slate-800 mb-4 flex items-center gap-2">
          <Code className="h-5 w-5 text-orange-500" />
          OBD DTO Field Names (exact backend contract)
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 mb-3">
            These 14 fields must be sent exactly as named. The ML service will reject unknown field names.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { key: 'map', label: 'MAP Sensor', unit: 'kPa' },
              { key: 'tps', label: 'TPS Sensor', unit: '%' },
              { key: 'force', label: 'Engine Force', unit: 'N·m' },
              { key: 'power', label: 'Engine Power', unit: 'kW' },
              { key: 'rpm', label: 'Engine RPM', unit: 'rpm' },
              { key: 'consumptionlh', label: 'Fuel Consumption', unit: 'L/h' },
              { key: 'consumptionl100km', label: 'Fuel Economy', unit: 'L/100km' },
              { key: 'speed', label: 'Vehicle Speed', unit: 'km/h' },
              { key: 'co', label: 'Carbon Monoxide', unit: '%' },
              { key: 'hc', label: 'Hydrocarbons', unit: 'ppm' },
              { key: 'co2', label: 'Carbon Dioxide', unit: '%' },
              { key: 'o2', label: 'Oxygen', unit: '%' },
              { key: 'lambda', label: 'Lambda', unit: 'ratio' },
              { key: 'afr', label: 'Air-Fuel Ratio', unit: 'ratio' },
            ].map(f => (
              <div key={f.key} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                <p className="font-mono text-sm font-bold text-orange-600">{f.key}</p>
                <p className="text-xs text-slate-600">{f.label}</p>
                <p className="text-xs text-slate-400">{f.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Error Handling Guide */}
      <section>
        <h2 className="text-slate-800 mb-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          Error Handling Reference
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="space-y-3 text-sm">
            {[
              { code: '401', action: 'Auto-logout → redirect to /login', color: 'text-red-600' },
              { code: '403', action: 'Show permission denied message. Do NOT redirect.', color: 'text-orange-600' },
              { code: '500+', action: 'Show server error toast. Preserve form state. Allow retry.', color: 'text-red-600' },
              { code: 'NetworkError', action: 'CORS / backend offline. Distinct message from API errors.', color: 'text-purple-600' },
              { code: '4xx validation', action: 'Display err.data.message or err.data.errors fields inline.', color: 'text-amber-600' },
            ].map(e => (
              <div key={e.code} className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                <span className={`font-mono text-xs font-bold ${e.color} shrink-0 mt-0.5 w-28`}>{e.code}</span>
                <span className="text-xs text-slate-600">{e.action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
