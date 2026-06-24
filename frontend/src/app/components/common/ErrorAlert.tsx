import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  fieldErrors?: Record<string, string>;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, fieldErrors, onDismiss }: ErrorAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700">{message}</p>
          {fieldErrors && Object.entries(fieldErrors).length > 0 && (
            <ul className="mt-2 space-y-1">
              {Object.entries(fieldErrors).map(([field, error]) => (
                <li key={field} className="text-xs text-red-600">
                  <span className="font-medium">{field}:</span> {error}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
