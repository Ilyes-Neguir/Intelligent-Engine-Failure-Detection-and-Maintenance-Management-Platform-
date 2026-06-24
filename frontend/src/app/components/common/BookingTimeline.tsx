import { Check, Clock, Wrench, CheckCircle, XCircle } from 'lucide-react';
import type { BookingStatus } from '../../types';

const STEPS = [
  { status: 'PENDING',     label: 'Pending',     icon: Clock },
  { status: 'CONFIRMED',   label: 'Confirmed',   icon: Check },
  { status: 'IN_PROGRESS', label: 'In Progress', icon: Wrench },
  { status: 'COMPLETED',   label: 'Completed',   icon: CheckCircle },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELED: -1,
};

export function BookingTimeline({ status }: { status: BookingStatus }) {
  if (status === 'CANCELED') {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Booking Canceled</span>
      </div>
    );
  }

  const currentOrder = STATUS_ORDER[status] ?? 0;

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const stepOrder = STATUS_ORDER[step.status];
        const isCompleted = stepOrder < currentOrder;
        const isCurrent = step.status === status;
        const isFuture = stepOrder > currentOrder;
        const Icon = step.icon;

        return (
          <div key={step.status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isCurrent
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-slate-200 text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-colors ${
                  stepOrder < currentOrder ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
