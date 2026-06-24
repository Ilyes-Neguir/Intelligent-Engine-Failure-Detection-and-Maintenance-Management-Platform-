import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ArrowLeft, Car, Calendar, User, Play, CheckCircle, AlertTriangle,
  AlertCircle, Activity, ChevronDown, ChevronUp, Cpu, FileDown,
  Download, Loader2, StickyNote, ClipboardCheck, RefreshCw,
} from 'lucide-react';
import { bookingsApi } from '../../api/bookings';
import { diagnosticsApi } from '../../api/diagnostics';
import type { OBDPayload } from '../../api/diagnostics';
import { vehiclesApi } from '../../api/vehicles';
import { reportsApi, triggerReportDownload } from '../../api/reports';
import type { Booking, OBDData, Report, Vehicle } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiError, NetworkError } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BookingTimeline } from '../../components/common/BookingTimeline';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── OBD Field Definitions ────────────────────────────────────────────────────
// ⚠️  Field keys MUST match backend DTO names exactly:
// map, tps, force, power, rpm, consumptionlh, consumptionl100km,
// speed, co, hc, co2, o2, lambda, afr

interface OBDField {
  key: keyof OBDPayload;
  label: string;
  unit: string;
  placeholder: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}

const OBD_SECTIONS: { title: string; color: string; fields: OBDField[] }[] = [
  {
    title: 'Air & Fuel Mixture',
    color: 'blue',
    fields: [
      { key: 'map',    label: 'MAP Sensor',         unit: 'kPa',   placeholder: '45.2',  min: 0,   max: 300, step: 0.1,  hint: 'Manifold Absolute Pressure' },
      { key: 'tps',    label: 'TPS Sensor',         unit: '%',     placeholder: '15.8',  min: 0,   max: 100, step: 0.1,  hint: 'Throttle Position Sensor' },
      { key: 'afr',    label: 'Air-Fuel Ratio',     unit: 'ratio', placeholder: '14.7',  min: 0,   max: 25,  step: 0.01, hint: 'Stoichiometric ≈ 14.7' },
      { key: 'lambda', label: 'Lambda (λ)',          unit: 'ratio', placeholder: '1.000', min: 0,   max: 5,   step: 0.001, hint: 'Normalized AFR — 1.0 = stoich' },
    ],
  },
  {
    title: 'Emissions',
    color: 'green',
    fields: [
      { key: 'co',  label: 'Carbon Monoxide (CO)',  unit: '%',   placeholder: '0.80',  min: 0,  max: 10,   step: 0.01 },
      { key: 'hc',  label: 'Hydrocarbons (HC)',     unit: 'ppm', placeholder: '120',   min: 0,  max: 9999, step: 1   },
      { key: 'co2', label: 'Carbon Dioxide (CO₂)',  unit: '%',   placeholder: '13.5',  min: 0,  max: 20,   step: 0.1 },
      { key: 'o2',  label: 'Oxygen (O₂)',           unit: '%',   placeholder: '1.20',  min: 0,  max: 25,   step: 0.01 },
    ],
  },
  {
    title: 'Engine Performance',
    color: 'orange',
    fields: [
      { key: 'rpm',   label: 'Engine RPM',      unit: 'rpm', placeholder: '3200', min: 0,   max: 10000, step: 1   },
      { key: 'force', label: 'Engine Force',     unit: 'N·m', placeholder: '180',  min: 0,   max: 2000,  step: 0.1, hint: 'Engine torque/force output' },
      { key: 'power', label: 'Engine Power',     unit: 'kW',  placeholder: '90',   min: 0,   max: 1000,  step: 0.1 },
      { key: 'speed', label: 'Vehicle Speed',    unit: 'km/h',placeholder: '80',   min: 0,   max: 350,   step: 0.1 },
    ],
  },
  {
    title: 'Fuel Consumption',
    color: 'purple',
    fields: [
      { key: 'consumptionlh',    label: 'Fuel Consumption',  unit: 'L/h',     placeholder: '6.5',  min: 0, max: 200,  step: 0.01, hint: 'Instantaneous fuel flow rate' },
      { key: 'consumptionl100km',label: 'Fuel Economy',      unit: 'L/100km', placeholder: '8.2',  min: 0, max: 100,  step: 0.01, hint: 'Consumption per 100 km' },
    ],
  },
];

const SECTION_COLORS: Record<string, string> = {
  blue:   'border-blue-200 bg-blue-50/40',
  green:  'border-green-200 bg-green-50/40',
  orange: 'border-orange-200 bg-orange-50/40',
  purple: 'border-purple-200 bg-purple-50/40',
};

const SECTION_HEADER_COLORS: Record<string, string> = {
  blue:   'text-blue-700 bg-blue-100/60',
  green:  'text-green-700 bg-green-100/60',
  orange: 'text-orange-700 bg-orange-100/60',
  purple: 'text-purple-700 bg-purple-100/60',
};

// ─── Fault Display Helper ─────────────────────────────────────────────────────
function getFaultConfig(fault: string) {
  const f = (fault ?? '').toLowerCase();
  if (f.includes('no fault') || f === '0') {
    return { bg: 'bg-green-50 border-green-200', text: 'text-green-800', bar: 'bg-green-500', icon: CheckCircle, iconCls: 'text-green-600', display: 'No Fault Detected' };
  }
  if (f.includes('ignition')) {
    return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', bar: 'bg-orange-500', icon: AlertTriangle, iconCls: 'text-orange-600', display: fault };
  }
  return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', bar: 'bg-red-500', icon: AlertCircle, iconCls: 'text-red-600', display: fault };
}

/** Normalize date field — backend may use createdAt or created_at */
function getDate(obj: { createdAt?: string; created_at?: string } | null): string {
  if (!obj) return '';
  return obj.createdAt ?? obj.created_at ?? '';
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MechanicBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [obd, setObd] = useState<OBDData | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // OBD form state — keys match OBDPayload exactly
  const [obdForm, setObdForm] = useState<Record<string, string>>({});
  const [submittingOBD, setSubmittingOBD] = useState(false);
  const [obdError, setObdError] = useState('');
  const [showOBDDetails, setShowOBDDetails] = useState(false);

  // Complete booking form
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  // Status actions
  const [startingDiag, setStartingDiag] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Report actions
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const load = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const b = await bookingsApi.getById(Number(bookingId));
      setBooking(b);

      // Resolve vehicle details — prefer nested object, else fetch by vehicleId
      if (b.vehicle) {
        setVehicle(b.vehicle);
      } else if (b.vehicleId) {
        try {
          const v = await vehiclesApi.getById(b.vehicleId);
          setVehicle(v);
        } catch { /* vehicle load failed, continue without it */ }
      }

      try { setObd(await diagnosticsApi.getByBooking(Number(bookingId))); } catch { /* no OBD yet */ }
      try { setReport(await reportsApi.getByBooking(Number(bookingId))); } catch { /* no report yet */ }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error('Access denied');
        navigate('/mechanic/bookings');
      } else if (err instanceof NetworkError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to load booking');
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [bookingId]);

  // ── Status transitions ──────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!booking) return;
    setAccepting(true);
    try {
      // POST /api/bookings/{id}/accept — no mechanicId in path
      await bookingsApi.accept(booking.id);
      toast.success('Booking confirmed!');
      load();
    } catch (err) {
      toast.error(err instanceof NetworkError ? err.message : err instanceof ApiError ? (err.data?.message ?? 'Failed to accept') : 'Failed to accept');
    } finally { setAccepting(false); }
  };

  const handleStart = async () => {
    if (!booking) return;
    setStartingDiag(true);
    try {
      // POST /api/bookings/{id}/start — no mechanicId in path
      await bookingsApi.start(booking.id);
      toast.success('Diagnostic session started!');
      load();
    } catch (err) {
      toast.error(err instanceof NetworkError ? err.message : err instanceof ApiError ? (err.data?.message ?? 'Failed to start') : 'Failed to start');
    } finally { setStartingDiag(false); }
  };

  // ── OBD Submission ──────────────────────────────────────────────────────────
  const allFields = OBD_SECTIONS.flatMap(s => s.fields);

  const handleOBDSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setObdError('');

    // Validate all 14 fields match backend DTO names
    for (const f of allFields) {
      const val = obdForm[f.key];
      if (val === undefined || val.trim() === '') {
        setObdError(`Please fill in "${f.label}" (${f.key}).`);
        return;
      }
      if (isNaN(Number(val))) {
        setObdError(`"${f.label}" must be a numeric value.`);
        return;
      }
    }

    // Build payload using exact backend DTO field names
    const payload = Object.fromEntries(
      allFields.map(f => [f.key, Number(obdForm[f.key])])
    ) as unknown as OBDPayload;

    setSubmittingOBD(true);
    try {
      const result = await diagnosticsApi.submit(booking.id, payload);
      setObd(result);
      toast.success('OBD data submitted — AI analysis complete!');
      load();
    } catch (err) {
      // Preserve form data on error
      if (err instanceof NetworkError) {
        setObdError(err.message);
      } else if (err instanceof ApiError) {
        if (err.status >= 500) {
          setObdError(`Server error (${err.status}). Your OBD data is preserved — please retry.`);
        } else {
          setObdError(err.data?.message ?? err.data?.details ?? 'Failed to submit OBD data.');
        }
      } else {
        setObdError('Unexpected error. Please retry.');
      }
    } finally { setSubmittingOBD(false); }
  };

  // ── Complete booking ────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!booking) return;
    setCompleting(true);
    try {
      // POST /api/bookings/{id}/complete — no mechanicId in path; body: { notes }
      await bookingsApi.complete(booking.id, { notes });
      toast.success('Booking completed successfully!');
      setNotes('');
      load();
    } catch (err) {
      toast.error(err instanceof NetworkError ? err.message : err instanceof ApiError ? (err.data?.message ?? 'Failed to complete booking') : 'Failed to complete');
    } finally { setCompleting(false); }
  };

  // ── Report ──────────────────────────────────────────────────────────────────
  const handleGenerateReport = async () => {
    if (!booking) return;
    setGeneratingReport(true);
    try {
      const r = await reportsApi.generate(booking.id);
      setReport(r);
      toast.success('PDF report generated!');
    } catch (err) {
      toast.error(err instanceof ApiError ? (err.data?.message ?? 'Failed to generate report') : 'Failed to generate');
    } finally { setGeneratingReport(false); }
  };

  const handleDownloadReport = async () => {
    if (!report) return;
    setDownloadingReport(true);
    try {
      await triggerReportDownload(report.id, report.fileName);
      toast.success('Download started');
    } catch { toast.error('Failed to download report'); }
    finally { setDownloadingReport(false); }
  };

  if (loading) return <PageLoader label="Loading booking details..." />;
  if (!booking) return null;

  // isMyBooking: check both nested mechanic object and mechanicId field
  const isMyBooking =
    (booking.mechanic?.id !== undefined && booking.mechanic.id === user?.userId) ||
    (booking.mechanicId !== undefined && booking.mechanicId === user?.userId);

  const faultCfg = obd ? getFaultConfig(obd.predicted_fault) : null;
  const FaultIcon = faultCfg?.icon;

  // Resolved display values
  const vehicleDisplay = vehicle
    ? `${vehicle.make} ${vehicle.model} (${vehicle.year})`
    : `Vehicle #${booking.vehicleId}`;
  const clientDisplay = booking.client?.name ?? `Client #${booking.clientId}`;
  const clientEmail = booking.client?.email ?? '';
  const clientPhone = booking.client?.phone ?? '';

  const bookingCreatedAt = booking.createdAt ?? (booking as any).created_at ?? '';
  const reportDate = getDate(report as any);
  const obdDate = getDate(obd as any);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/mechanic/bookings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to My Bookings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-slate-800">Booking #{booking.id}</h1>
            <StatusBadge status={booking.status} />
          </div>
          {bookingCreatedAt && (
            <p className="text-sm text-slate-500">
              Created {format(new Date(bookingCreatedAt), 'MMM d, yyyy · h:mm a')}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm overflow-x-auto">
        <h3 className="text-slate-700 mb-4">Booking Progress</h3>
        <BookingTimeline status={booking.status} />
      </div>

      {/* Info grid */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <InfoCard icon={Car} title="Vehicle">
          <p className="text-slate-800">{vehicleDisplay}</p>
          {vehicle && (
            <>
              <p className="text-sm text-slate-500 mt-1">VIN: <span className="font-mono">{vehicle.vin}</span></p>
              {vehicle.licensePlate && <p className="text-sm text-slate-500">Plate: {vehicle.licensePlate}</p>}
              {vehicle.engineType && <p className="text-sm text-slate-500">Engine: {vehicle.engineType}</p>}
            </>
          )}
        </InfoCard>

        <InfoCard icon={User} title="Client">
          <p className="text-slate-800">{clientDisplay}</p>
          {clientEmail && <p className="text-sm text-slate-500">{clientEmail}</p>}
          {clientPhone && <p className="text-sm text-slate-500">{clientPhone}</p>}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-sm text-slate-600">
              {format(new Date(booking.scheduledTime), 'MMM d, yyyy · h:mm a')}
            </p>
          </div>
        </InfoCard>
      </div>

      {booking.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
          <h3 className="text-slate-700 mb-2">Client Description</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{booking.description}</p>
        </div>
      )}

      {/* ── ACTION SECTION ──────────────────────────────────────────────────── */}

      {/* PENDING → Accept */}
      {booking.status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
          <h3 className="text-amber-800 mb-2">Unassigned Booking</h3>
          <p className="text-sm text-amber-700 mb-4">Accept this booking to assign it to yourself and confirm with the client.</p>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm text-white font-medium hover:bg-green-700 disabled:opacity-60"
          >
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {accepting ? 'Accepting...' : 'Accept Booking'}
          </button>
        </div>
      )}

      {/* CONFIRMED → Start Diagnostic */}
      {booking.status === 'CONFIRMED' && isMyBooking && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
          <h3 className="text-blue-800 mb-2">Ready to Start</h3>
          <p className="text-sm text-blue-700 mb-4">When you're with the vehicle and ready to collect OBD data, start the diagnostic session.</p>
          <button
            onClick={handleStart}
            disabled={startingDiag}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {startingDiag ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {startingDiag ? 'Starting...' : 'Start Diagnostic Session'}
          </button>
        </div>
      )}

      {/* IN_PROGRESS + no OBD → OBD Form */}
      {booking.status === 'IN_PROGRESS' && isMyBooking && !obd && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-orange-50 px-6 py-4">
            <Cpu className="h-5 w-5 text-orange-600" />
            <div>
              <h2 className="text-slate-800">OBD Sensor Data Entry</h2>
              <p className="text-sm text-orange-700">Enter all 14 sensor readings for AI fault analysis</p>
            </div>
          </div>

          <form onSubmit={handleOBDSubmit} className="p-6 space-y-6">
            {obdError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {obdError}
              </div>
            )}

            {OBD_SECTIONS.map(section => (
              <div key={section.title} className={`rounded-xl border ${SECTION_COLORS[section.color]} overflow-hidden`}>
                <div className={`px-4 py-2.5 ${SECTION_HEADER_COLORS[section.color]}`}>
                  <p className="text-sm font-semibold">{section.title}</p>
                </div>
                <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm text-slate-700 mb-1">
                        {field.label}
                        <span className="ml-1 text-xs text-slate-400">({field.unit})</span>
                      </label>
                      <input
                        type="number"
                        step={field.step ?? 'any'}
                        min={field.min}
                        max={field.max}
                        required
                        value={obdForm[field.key] ?? ''}
                        onChange={e => setObdForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      {field.hint && <p className="mt-0.5 text-xs text-slate-400">{field.hint}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setObdForm({})}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={submittingOBD}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 text-sm text-white font-medium hover:bg-orange-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {submittingOBD ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    Submit for AI Analysis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OBD Results Display */}
      {obd && faultCfg && FaultIcon && (
        <div className={`rounded-xl border ${faultCfg.bg} p-6 mb-5 shadow-sm`}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-slate-500" />
            <h2 className="text-slate-800">AI Diagnostic Result</h2>
          </div>

          {/* Hero fault display */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-white/50 rounded-xl border border-white">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <FaultIcon className={`h-7 w-7 ${faultCfg.iconCls}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${faultCfg.text}`}>{faultCfg.display}</p>
              <p className="text-sm text-slate-500 mt-0.5">Neural Network Fault Classification</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-600">Confidence Score</span>
              <span className={`font-semibold ${faultCfg.text}`}>
                {(obd.confidence_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/60 border border-white overflow-hidden">
              <div
                className={`h-full rounded-full ${faultCfg.bar} transition-all duration-700`}
                style={{ width: `${Math.min(obd.confidence_score * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Toggle sensor readings */}
          <button
            onClick={() => setShowOBDDetails(v => !v)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            {showOBDDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showOBDDetails ? 'Hide' : 'View'} submitted sensor readings
          </button>

          {showOBDDetails && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {OBD_SECTIONS.flatMap(s => s.fields).map(f => {
                const val = (obd as any)[f.key];
                return (
                  <div key={f.key} className="rounded-lg bg-white/70 border border-white px-3 py-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">{f.label}</p>
                    <p className="font-mono text-sm font-medium text-slate-800">
                      {val !== undefined ? Number(val).toFixed(2) : '—'}{' '}
                      <span className="text-xs font-normal text-slate-400">{f.unit}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {obdDate && (
            <p className="mt-3 text-xs text-slate-400">
              Analysis completed {format(new Date(obdDate), 'MMM d, yyyy · h:mm a')}
            </p>
          )}
        </div>
      )}

      {/* Complete Booking (IN_PROGRESS + OBD done) */}
      {booking.status === 'IN_PROGRESS' && isMyBooking && obd && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            <h2 className="text-slate-800">Complete Booking</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Add your mechanic notes and mark this booking as complete. The client will be notified.
          </p>
          <div className="mb-4">
            <label className="block text-sm text-slate-700 mb-1.5">
              <StickyNote className="inline h-4 w-4 mr-1 text-slate-400" />
              Mechanic Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Add your findings, recommendations, or observations..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{notes.length}/2000</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm text-white font-medium hover:bg-green-700 disabled:opacity-60 shadow-sm"
            >
              {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {completing ? 'Completing...' : 'Mark as Completed'}
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED — mechanic notes display */}
      {booking.status === 'COMPLETED' && booking.mechanicNotes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-4 w-4 text-slate-400" />
            <h3 className="text-slate-700">Mechanic Notes</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{booking.mechanicNotes}</p>
        </div>
      )}

      {/* Report generation (COMPLETED) */}
      {booking.status === 'COMPLETED' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileDown className="h-4 w-4 text-slate-400" />
            <h3 className="text-slate-700">Diagnostic Report</h3>
          </div>
          {report ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{report.fileName}</p>
                {reportDate && (
                  <p className="text-xs text-slate-400">
                    Generated {format(new Date(reportDate), 'MMM d, yyyy · h:mm a')}
                  </p>
                )}
              </div>
              <button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {downloadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloadingReport ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">No report generated yet.</p>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {generatingReport ? 'Generating...' : 'Generate PDF Report'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-slate-400" />
        <h3 className="text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}
