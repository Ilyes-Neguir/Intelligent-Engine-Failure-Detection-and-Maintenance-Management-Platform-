import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ClipboardList, Car, User, Calendar, ChevronRight, Search, WifiOff } from 'lucide-react';
import { bookingsApi } from '../../api/bookings';
import { vehiclesApi } from '../../api/vehicles';
import type { Booking, Vehicle, BookingStatus } from '../../types';
import { ApiError, NetworkError } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TABS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'All' },
  { value: 'CONFIRMED',   label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED',   label: 'Completed' },
  { value: 'CANCELED',    label: 'Canceled' },
];

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicleMap, setVehicleMap] = useState<Record<number, Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<BookingStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadError('');
      try {
        // GET /api/bookings/my — JWT-identity-based, no userId in path
        const all = await bookingsApi.getMy();
        // Show only assigned bookings (exclude PENDING — those go to pending queue)
        const assigned = all.filter(b => b.status !== 'PENDING');
        setBookings(assigned);

        // Enrich vehicle info for bookings without nested vehicle objects
        const needsFetch = assigned.filter(b => !b.vehicle && b.vehicleId);
        if (needsFetch.length > 0) {
          const uniqueIds = [...new Set(needsFetch.map(b => b.vehicleId))];
          const results = await Promise.allSettled(uniqueIds.map(id => vehiclesApi.getById(id)));
          const map: Record<number, Vehicle> = {};
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') map[uniqueIds[i]] = r.value;
          });
          setVehicleMap(map);
        }
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
    load();
  }, []);

  const getVehicleDisplay = (b: Booking): string => {
    if (b.vehicle) return `${b.vehicle.make} ${b.vehicle.model} (${b.vehicle.year})`;
    const v = vehicleMap[b.vehicleId];
    if (v) return `${v.make} ${v.model} (${v.year})`;
    return `Vehicle #${b.vehicleId}`;
  };

  const getClientDisplay = (b: Booking): string =>
    b.client?.name ?? `Client #${b.clientId}`;

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'ALL' || b.status === tab;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      getVehicleDisplay(b).toLowerCase().includes(q) ||
      getClientDisplay(b).toLowerCase().includes(q) ||
      b.id.toString().includes(q);
    return matchTab && matchSearch;
  });

  const countFor = (s: BookingStatus | 'ALL') =>
    s === 'ALL' ? bookings.length : bookings.filter(b => b.status === s).length;

  if (loading) return <PageLoader label="Loading your bookings..." />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </div>
          <h1 className="text-slate-800">My Bookings</h1>
        </div>
        <p className="text-sm text-slate-500 ml-11">Manage and track your assigned diagnostic sessions</p>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <WifiOff className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client, vehicle, or ID..."
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              tab === t.value ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {countFor(t.value)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={bookings.length === 0 ? 'No assigned bookings' : 'No bookings in this category'}
          description={
            bookings.length === 0
              ? 'Accept bookings from the Pending Queue to see them here.'
              : 'Try a different filter or search term.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <Link
              key={b.id}
              to={`/mechanic/bookings/${b.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-sm text-slate-400">#{b.id}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Client</p>
                        <p className="text-sm text-slate-800">{getClientDisplay(b)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Car className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Vehicle</p>
                        <p className="text-sm text-slate-800">{getVehicleDisplay(b)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Scheduled</p>
                        <p className="text-sm text-slate-800">{format(new Date(b.scheduledTime), 'MMM d, yyyy · h:mm a')}</p>
                      </div>
                    </div>
                  </div>
                  {b.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-1">{b.description}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors mt-1 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
