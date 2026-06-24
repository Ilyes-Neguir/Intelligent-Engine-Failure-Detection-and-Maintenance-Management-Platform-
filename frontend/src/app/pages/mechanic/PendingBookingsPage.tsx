import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Clock, Car, User, Calendar, ChevronRight, Search, CheckCircle, WifiOff } from 'lucide-react';
import { bookingsApi } from '../../api/bookings';
import { vehiclesApi } from '../../api/vehicles';
import type { Booking, Vehicle } from '../../types';
import { ApiError, NetworkError } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function PendingBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicleMap, setVehicleMap] = useState<Record<number, Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [accepting, setAccepting] = useState<number | null>(null);

  const fetchBookings = async () => {
    setLoadError('');
    try {
      // GET /api/bookings/my — JWT-identity-based, no userId in path
      // For MECHANIC role, backend returns bookings assigned to this mechanic
      // plus PENDING bookings available to accept
      const all = await bookingsApi.getMy();
      const pending = all.filter(b => b.status === 'PENDING');
      setBookings(pending);

      // Enrich vehicle info: if backend doesn't return nested vehicle objects,
      // fetch each unique vehicle by ID in parallel
      const needsFetch = pending.filter(b => !b.vehicle && b.vehicleId);
      if (needsFetch.length > 0) {
        const uniqueVehicleIds = [...new Set(needsFetch.map(b => b.vehicleId))];
        const results = await Promise.allSettled(
          uniqueVehicleIds.map(id => vehiclesApi.getById(id))
        );
        const map: Record<number, Vehicle> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') map[uniqueVehicleIds[i]] = r.value;
        });
        setVehicleMap(map);
      }
    } catch (err) {
      const msg = err instanceof NetworkError
        ? err.message
        : err instanceof ApiError
          ? (err.data?.message ?? 'Failed to load pending bookings')
          : 'Failed to load pending bookings';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleAccept = async (bookingId: number) => {
    setAccepting(bookingId);
    try {
      // POST /api/bookings/{id}/accept — no mechanicId in path
      await bookingsApi.accept(bookingId);
      toast.success('Booking accepted! It is now CONFIRMED.');
      fetchBookings();
    } catch (err) {
      const msg = err instanceof NetworkError
        ? err.message
        : err instanceof ApiError
          ? (err.data?.message ?? 'Failed to accept booking')
          : 'Failed to accept booking';
      toast.error(msg);
    } finally {
      setAccepting(null);
    }
  };

  /** Returns vehicle display string, checking nested object then vehicleMap then ID */
  const getVehicleDisplay = (b: Booking) => {
    if (b.vehicle) return { label: `${b.vehicle.make} ${b.vehicle.model}`, sub: `${b.vehicle.year} · ${b.vehicle.licensePlate || b.vehicle.vin.slice(0, 8) + '...'}` };
    const v = vehicleMap[b.vehicleId];
    if (v) return { label: `${v.make} ${v.model}`, sub: `${v.year} · ${v.licensePlate || v.vin.slice(0, 8) + '...'}` };
    return { label: `Vehicle #${b.vehicleId}`, sub: '' };
  };

  /** Returns client display string */
  const getClientDisplay = (b: Booking) => ({
    name: b.client?.name ?? `Client #${b.clientId}`,
    email: b.client?.email ?? '',
  });

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    const { label } = getVehicleDisplay(b);
    const { name } = getClientDisplay(b);
    return (
      label.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      b.id.toString().includes(q)
    );
  });

  if (loading) return <PageLoader label="Loading pending bookings..." />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
          <h1 className="text-slate-800">Pending Bookings Queue</h1>
        </div>
        <p className="text-sm text-slate-500 ml-11">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} awaiting acceptance
        </p>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <WifiOff className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{loadError}</p>
            <button onClick={fetchBookings} className="text-xs text-red-500 hover:text-red-700 mt-1 underline">Retry</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client, vehicle, or booking ID..."
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={bookings.length === 0 ? 'No pending bookings' : 'No bookings match your search'}
          description={
            bookings.length === 0
              ? 'All client bookings are currently assigned or resolved. Check back soon.'
              : 'Try adjusting your search.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const vehicleInfo = getVehicleDisplay(b);
            const clientInfo = getClientDisplay(b);
            return (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Booking info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-sm text-slate-500">#{b.id}</span>
                      <StatusBadge status={b.status} />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      {/* Client */}
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Client</p>
                          <p className="text-sm text-slate-800">{clientInfo.name}</p>
                          {clientInfo.email && <p className="text-xs text-slate-500">{clientInfo.email}</p>}
                        </div>
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-start gap-2">
                        <Car className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Vehicle</p>
                          <p className="text-sm text-slate-800">{vehicleInfo.label}</p>
                          {vehicleInfo.sub && <p className="text-xs text-slate-500">{vehicleInfo.sub}</p>}
                        </div>
                      </div>

                      {/* Scheduled */}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">Scheduled</p>
                          <p className="text-sm text-slate-800">{format(new Date(b.scheduledTime), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-slate-500">{format(new Date(b.scheduledTime), 'h:mm a')}</p>
                        </div>
                      </div>
                    </div>

                    {b.description && (
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Client notes:</p>
                        <p className="text-sm text-slate-700 line-clamp-2">{b.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
                    <button
                      onClick={() => handleAccept(b.id)}
                      disabled={accepting === b.id}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      {accepting === b.id ? (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {accepting === b.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <Link
                      to={`/mechanic/bookings/${b.id}`}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Details <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
