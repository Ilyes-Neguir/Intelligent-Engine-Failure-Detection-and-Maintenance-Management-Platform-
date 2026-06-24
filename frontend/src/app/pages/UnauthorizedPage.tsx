import { useNavigate } from 'react-router';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const home = user
    ? user.role === 'CLIENT' ? '/client/vehicles' : '/mechanic/pending'
    : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-slate-800 mb-2">403 — Access Denied</h1>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
          You don't have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate(home)}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
