import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ArrowLeft, Car, Calendar, User, FileText, Download,
  Activity, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, AlertCircle,
  FileDown, RefreshCw,
} from 'lucide-react';
import { bookingsApi } from '../../api/bookings';
import { diagnosticsApi } from '../../api/diagnostics';
import { vehiclesApi } from '../../api/vehicles';
import { reportsApi, triggerReportDownload } from '../../api/reports';
import type { Booking, OBDData, Report, Vehicle } from '../../types';
import { ApiError, NetworkError } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BookingTimeline } from '../../components/common/BookingTimeline';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

// OBD display labels — keys match backend DTO field names exactly
const OBD_LABELS: { key: keyof OBDData; label: string; unit: string }[] = [
  { key: 'map',            label: 'MAP Sensor',            unit: 'kPa' },
  { key: 'tps',            label: 'TPS Sensor',            unit: '%' },
  { key: 'afr',            label: 'Air-Fuel Ratio (AFR)',  unit: 'ratio' },
  { key: 'lambda',         label: 'Lambda (λ)',             unit: 'ratio' },
  { key: 'co',             label: 'Carbon Monoxide (CO)',   unit: '%' },
  { key: 'hc',             label: 'Hydrocarbons (HC)',      unit: 'ppm' },
  { key: 'co2',            label: 'Carbon Dioxide (CO₂)',   unit: '%' },
  { key: 'o2',             label: 'Oxygen (O₂)',            unit: '%' },
  { key: 'rpm',            label: 'Engine RPM',             unit: 'rpm' },
  { key: 'force',          label: 'Engine Force',           unit: 'N·m' },
  { key: 'power',          label: 'Engine Power',           unit: 'kW' },
  { key: 'speed',          label: 'Vehicle Speed',          unit: 'km/h' },
  { key: 'consumptionlh',  label: 'Fuel Consumption',       unit: 'L/h' },
  { key: 'consumptionl100km', label: 'Fuel Economy',        unit: 'L/100km' },
];

function getFaultStyle(fault: string) {
  const f = (fault ?? '').toLowerCase();
  if (f.includes('no fault') || f === '0') {
    return {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      bar: 'bg-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      label: 'No Fault Detected',
    };
  }
  if (f.includes('ignition')) {
    return {
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-800',
      bar: 'bg-orange-500',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
      label: fault,
    };
  }
  return {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    bar: 'bg-red-500',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    label: fault,
  };
}

/** Normalize date field — backend may use createdAt or created_at */
function getDate(obj: { createdAt?: string; created_at?: string }): string {
  return obj.createdAt ?? obj.created_at ?? '';
}

export function ClientBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [obd, setObd] = useState<OBDData | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOBDDetails, setShowOBDDetails] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [canceling, setCanceling] = useState(false);

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

      // Try to load OBD data (optional — not available until mechanic submits it)
      try {
        const d = await diagnosticsApi.getByBooking(Number(bookingId));
        setObd(d);
      } catch { /* No OBD data yet */ }

      // Try to load report (optional — only available after generation)
      try {
        const r = await reportsApi.getByBooking(Number(bookingId));
        setReport(r);
      } catch { /* No report yet */ }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error('Access denied');
        navigate('/client/bookings');
      } else if (err instanceof NetworkError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to load booking details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [bookingId]);

  const handleCancel = async () => {
    if (!booking) return;
    setCanceling(true);
    try {
      // POST /api/bookings/{id}/cancel — no userId in path
      await bookingsApi.cancel(booking.id);
      toast.success('Booking canceled');
      load();
    } catch (err) {
      const msg = err instanceof NetworkError
        ? err.message
        : err instanceof ApiError
          ? (err.data?.message ?? 'Failed to cancel')
          : 'Failed to cancel';
      toast.error(msg);
    } finally {
      setCanceling(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!booking) return;
    setGeneratingReport(true);
    try {
      const r = await reportsApi.generate(booking.id);
      setReport(r);
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error(err instanceof ApiError ? (err.data?.message ?? 'Failed to generate report') : 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    setDownloadingReport(true);
    try {
      await triggerReportDownload(report.id, report.fileName);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading) return <PageLoader label="Loading booking details..." />;
  if (!booking) return null;

  const faultStyle = obd ? getFaultStyle(obd.predicted_fault) : null;
  const FaultIcon = faultStyle?.icon;
  const canCancel = booking.status !== 'COMPLETED' && booking.status !== 'CANCELED';

  // Resolve display names with fallbacks
  const vehicleDisplay = vehicle
    ? `${vehicle.make} ${vehicle.model} (${vehicle.year})`
    : `Vehicle #${booking.vehicleId}`;

  const mechanicDisplay = booking.mechanic?.name
    ?? (booking.mechanicId ? `Mechanic #${booking.mechanicId}` : null);

  const bookingCreatedAt = booking.createdAt ?? (booking as any).created_at ?? '';
  const reportDate = report ? getDate(report as any) : '';
  const obdDate = obd ? getDate(obd as any) : '';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link to="/client/bookings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
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
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={canceling}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors shrink-0"
          >
            {canceling && <div className="h-3.5 w-3.5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />}
            {canceling ? 'Canceling...' : 'Cancel Booking'}
          </button>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
        <h3 className="text-slate-700 mb-4">Booking Progress</h3>
        <BookingTimeline status={booking.status} />
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Vehicle */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Car className="h-4 w-4 text-slate-400" />
            <h3 className="text-slate-700">Vehicle</h3>
          </div>
          <div className="space-y-2">
            <p className="text-slate-800">{vehicleDisplay}</p>
            {vehicle && (
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-slate-500">VIN: <span className="font-mono text-slate-700">{vehicle.vin}</span></span>
                {vehicle.licensePlate && (
                  <span className="text-slate-500">Plate: <span className="text-slate-700">{vehicle.licensePlate}</span></span>
                )}
                {vehicle.engineType && (
                  <span className="text-slate-500">Engine: <span className="text-slate-700">{vehicle.engineType}</span></span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Appointment */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-slate-400" />
            <h3 className="text-slate-700">Appointment</h3>
          </div>
          <div className="space-y-2">
            <p className="text-slate-800">{format(new Date(booking.scheduledTime), 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-slate-600 text-sm">{format(new Date(booking.scheduledTime), 'h:mm a')}</p>
            {mechanicDisplay && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Mechanic: <strong>{mechanicDisplay}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description & Notes */}
      {(booking.description || booking.mechanicNotes) && (
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {booking.description && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <h3 className="text-slate-700">Your Description</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{booking.description}</p>
            </div>
          )}
          {booking.mechanicNotes && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-slate-400" />
                <h3 className="text-slate-700">Mechanic Notes</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{booking.mechanicNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Results */}
      {obd && faultStyle && FaultIcon && (
        <div className="mb-5">
          <div className={`rounded-xl border ${faultStyle.bg} p-6 shadow-sm`}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-slate-500" />
              <h3 className="text-slate-700">AI Diagnostic Result</h3>
            </div>

            {/* Fault classification */}
            <div className="flex items-center gap-3 mb-5">
              <FaultIcon className={`h-8 w-8 ${faultStyle.iconColor}`} />
              <div>
                <p className={`text-lg font-semibold ${faultStyle.text}`}>{faultStyle.label}</p>
                <p className="text-sm text-slate-500">AI Fault Classification</p>
              </div>
            </div>

            {/* Confidence score */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600">Confidence Score</span>
                <span className={`font-semibold ${faultStyle.text}`}>
                  {(obd.confidence_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/60 overflow-hidden">
                <div
                  className={`h-full rounded-full ${faultStyle.bar} transition-all duration-700`}
                  style={{ width: `${Math.min(obd.confidence_score * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Toggle OBD details */}
            <button
              onClick={() => setShowOBDDetails(v => !v)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              {showOBDDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showOBDDetails ? 'Hide' : 'Show'} OBD Sensor Readings
            </button>

            {showOBDDetails && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {OBD_LABELS.map(({ key, label, unit }) => {
                  const val = obd[key];
                  return (
                    <div key={key} className="rounded-lg bg-white/60 px-3 py-2.5 border border-white/80">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="font-mono text-sm font-medium text-slate-800">
                        {typeof val === 'number' ? val.toFixed(2) : '—'}{' '}
                        <span className="text-xs font-normal text-slate-400">{unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {obdDate && (
              <p className="mt-3 text-xs text-slate-400">
                Analyzed on {format(new Date(obdDate), 'MMM d, yyyy · h:mm a')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Report Section */}
      {booking.status === 'COMPLETED' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileDown className="h-4 w-4 text-slate-400" />
            <h3 className="text-slate-700">Diagnostic Report</h3>
          </div>
          {report ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700 font-medium">{report.fileName}</p>
                {reportDate && (
                  <p className="text-xs text-slate-400">
                    Generated {format(new Date(reportDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <button
                onClick={handleDownload}
                disabled={downloadingReport}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {downloadingReport
                  ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <Download className="h-4 w-4" />}
                {downloadingReport ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Report not yet generated by the mechanic.</p>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                {generatingReport
                  ? <div className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
