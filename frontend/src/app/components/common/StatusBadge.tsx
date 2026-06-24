import type { BookingStatus } from '../../types';

const CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  PENDING:     { label: 'Pending',     className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  CONFIRMED:   { label: 'Confirmed',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-orange-50 text-orange-700 border border-orange-200' },
  COMPLETED:   { label: 'Completed',   className: 'bg-green-50 text-green-700 border border-green-200' },
  CANCELED:    { label: 'Canceled',    className: 'bg-red-50 text-red-600 border border-red-200' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
