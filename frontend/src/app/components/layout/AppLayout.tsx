import { useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router';
import {
  Car, CalendarDays, ClipboardList, Clock, LogOut,
  Menu, X, Cpu, ChevronRight, User, Code,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const CLIENT_NAV = [
  { to: '/client/vehicles',  label: 'My Vehicles',  icon: Car },
  { to: '/client/bookings',  label: 'My Bookings',  icon: CalendarDays },
];

const MECHANIC_NAV = [
  { to: '/mechanic/pending',   label: 'Pending Queue',  icon: Clock },
  { to: '/mechanic/bookings',  label: 'My Bookings',    icon: ClipboardList },
];

export function AppLayout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const navItems = user.role === 'CLIENT' ? CLIENT_NAV : MECHANIC_NAV;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const roleBadge =
    user.role === 'CLIENT'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Cpu className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">Engine AI</p>
          <p className="text-xs text-slate-400">Diagnostics Platform</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {user.role === 'CLIENT' ? 'Client Portal' : 'Mechanic Portal'}
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700">
            <User className="h-4.5 w-4.5 text-slate-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${roleBadge}`}>
            {user.role}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
        {/* Dev checklist link — visible only in dev mode */}
        {import.meta.env.DEV && (
          <NavLink
            to="/dev/checklist"
            onClick={onClose}
            className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors"
          >
            <Code className="h-3 w-3" />
            Dev Checklist
          </NavLink>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top header (mobile) */}
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Engine AI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}