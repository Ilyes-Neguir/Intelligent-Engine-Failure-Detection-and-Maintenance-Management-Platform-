import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, Plus, X, ChevronRight, Search, Filter, AlertTriangle, WifiOff } from 'lucide-react';
import { bookingsApi } from '../../api/bookings';
import { vehiclesApi } from '../../api/vehicles';
import type { Booking, Vehicle, BookingStatus } from '../../types';
import { ApiError, NetworkError } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_FILTERS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELED', label: 'Canceled' },
];

/** Returns a display label for a booking's vehicle, with fallback to vehicleId */
function vehicleLabel(b: Booking, vehicleMap: Record<number, Vehicle>): string {
  // Prefer nested vehicle object from booking response (if backend provides it)
  if (b.vehicle?.make) return `${b.vehicle.make} ${b.vehicle.model}`;
  // Fallback: look up from separately loaded vehicles list
  const v = vehicleMap[b.vehicleId];
  if (v) return `${v.make} ${v.model}`;
  return `Vehicle #${b.vehicleId}`;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-slate-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ClientBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // Map vehicleId → Vehicle for display fallback
  const [vehicleMap, setVehicleMap] = useState<Record<number, Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [canceling, setCanceling] = useState(false);

  // New booking form
  const [form, setForm] = useState({ vehicleId: '', scheduledTime: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoadError('');
    try {
      // Both routes are JWT-identity-based — no userId in path
      const [b, v] = await Promise.all([
        bookingsApi.getMy(),
        vehiclesApi.getMy(),
      ]);
      setBookings(b);
      setVehicles(v);
      // Build vehicleId → Vehicle map for display enrichment
      const map: Record<number, Vehicle> = {};
      v.forEach(vehicle => { map[vehicle.id] = vehicle; });
      setVehicleMap(map);
    } catch (err) {
      const msg = err instanceof NetworkError
        ? err.message
        : err instanceof ApiError
          ? (err.data?.message ?? 'Failed to load bookings')
          : 'Failed to load bookings';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const label = vehicleLabel(b, vehicleMap);
    const matchSearch = search === '' ||
      label.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toString().includes(search);
    return matchStatus && matchSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      // POST /api/bookings — no userId in path
      await bookingsApi.create({
        vehicleId: Number(form.vehicleId),
        scheduledTime: form.scheduledTime,
        description: form.description || undefined,
      });
      toast.success('Booking created successfully');
      setModalOpen(false);
      setForm({ vehicleId: '', scheduledTime: '', description: '' });
      fetchData();
    } catch (err) {
      // Preserve form data on error
      if (err instanceof NetworkError) {
        setFormError(err.message);
      } else if (err instanceof ApiError) {
        if (err.status >= 500) {
          setFormError(`Server error (${err.status}). Your form data is preserved — please retry.`);
        } else {
          setFormError(err.data?.message ?? err.data?.details ?? 'Failed to create booking');
        }
      } else {
        setFormError('Unexpected error. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      // POST /api/bookings/{id}/cancel — no userId in path
      await bookingsApi.cancel(cancelTarget.id);
      toast.success('Booking canceled');
      setCancelTarget(null);
      fetchData();
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

  if (loading) return <PageLoader label="Loading bookings..." />;

  const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">My Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            if (vehicles.length === 0) {
              toast.error('Please register a vehicle first before creating a booking.');
              return;
            }
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <WifiOff className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{loadError}</p>
            <button onClick={fetchData} className="text-xs text-red-500 hover:text-red-700 mt-1 underline">Retry</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by vehicle or booking ID..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
          description={bookings.length === 0 ? 'Create your first diagnostic booking to get started.' : 'Try adjusting your search or filter criteria.'}
          action={
            bookings.length === 0 ? (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> New Booking
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Mechanic</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-slate-600">#{b.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-800">{vehicleLabel(b, vehicleMap)}</span>
                      <span className="block text-xs text-slate-400">
                        {b.vehicle?.year ?? vehicleMap[b.vehicleId]?.year ?? ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">
                        {format(new Date(b.scheduledTime), 'MMM d, yyyy')}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {format(new Date(b.scheduledTime), 'h:mm a')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {b.mechanic?.name
                          ? b.mechanic.name
                          : b.mechanicId
                            ? `Mechanic #${b.mechanicId}`
                            : <span className="text-slate-300 italic">Unassigned</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {b.status !== 'COMPLETED' && b.status !== 'CANCELED' && (
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <Link
                          to={`/client/bookings/${b.id}`}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {modalOpen && (
        <Modal title="New Diagnostic Booking" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-700 mb-1.5">Vehicle *</label>
              <select
                required
                value={form.vehicleId}
                onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.year}) — {v.licensePlate || v.vin}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1.5">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                required
                min={minDateTime}
                value={form.scheduledTime}
                onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                maxLength={1000}
                rows={3}
                placeholder="Describe the symptoms... (e.g. check engine light, rough idle)"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
              <p className="text-xs text-slate-400 text-right mt-1">{form.description.length}/1000</p>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {creating && <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {creating ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirm */}
      {cancelTarget && (
        <Modal title="Cancel Booking" onClose={() => setCancelTarget(null)}>
          <div className="flex items-start gap-3 mb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm text-slate-700">
              Cancel booking <strong>#{cancelTarget.id}</strong> for{' '}
              <strong>{vehicleLabel(cancelTarget, vehicleMap)}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setCancelTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
            >
              {canceling && <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {canceling ? 'Canceling...' : 'Cancel Booking'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
