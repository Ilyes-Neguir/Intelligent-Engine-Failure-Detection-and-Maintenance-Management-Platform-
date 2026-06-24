import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router';
import { Cpu, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError, NetworkError } from '../../api/client';
import type { UserRole } from '../../types';
import { toast } from 'sonner';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: UserRole;
}

export function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'CLIENT',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Already authenticated — redirect to dashboard
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'CLIENT' ? '/client/vehicles' : '/mechanic/pending'} replace />;
  }

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }
    if (form.password.length < 6) {
      setFieldErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const registered = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });

      // ⚠️  Register does NOT authenticate — response has no token.
      // Always redirect to /login after successful registration.
      toast.success(`Account created for ${registered.name}! Please sign in to continue.`);
      navigate('/login');
    } catch (err) {
      if (err instanceof NetworkError) {
        // CORS / server not running
        setError(err.message);
      } else if (err instanceof ApiError) {
        if (err.data?.errors) setFieldErrors(err.data.errors);
        if (err.status >= 500) {
          setError(`Server error (${err.status}). Please try again shortly.`);
        } else {
          setError(err.data?.message ?? err.data?.details ?? 'Registration failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-7">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-white text-xl">Engine AI</h1>
                <p className="text-blue-200 text-xs">Intelligent Failure Detection</p>
              </div>
            </div>
            <h2 className="text-white text-lg">Create an account</h2>
            <p className="text-blue-200 text-sm mt-1">Join the diagnostics platform</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selection */}
              <div>
                <label className="block text-sm text-slate-700 mb-1.5">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['CLIENT', 'MECHANIC'] as UserRole[]).map(role => (
                    <label
                      key={role}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        form.role === role
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={form.role === role}
                        onChange={() => setForm(f => ({ ...f, role }))}
                        className="sr-only"
                      />
                      {role === 'CLIENT' ? '🚗 Client' : '🔧 Mechanic'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Phone number</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Engine Failure Detection Platform · JWT-Secured
        </p>
      </div>
    </div>
  );
}
