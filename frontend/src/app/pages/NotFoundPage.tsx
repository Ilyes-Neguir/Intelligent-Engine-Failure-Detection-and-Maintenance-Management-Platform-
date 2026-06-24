import { Link } from 'react-router';
import { SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <SearchX className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        <h1 className="text-slate-800 mb-2">404 — Page Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
