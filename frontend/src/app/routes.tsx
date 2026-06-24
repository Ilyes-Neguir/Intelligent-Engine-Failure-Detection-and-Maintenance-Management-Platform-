import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { RootRedirect } from './pages/RootRedirect';
import { VehiclesPage } from './pages/client/VehiclesPage';
import { ClientBookingsPage } from './pages/client/ClientBookingsPage';
import { ClientBookingDetailPage } from './pages/client/ClientBookingDetailPage';
import { PendingBookingsPage } from './pages/mechanic/PendingBookingsPage';
import { MyBookingsPage } from './pages/mechanic/MyBookingsPage';
import { MechanicBookingDetailPage } from './pages/mechanic/MechanicBookingDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DevChecklist } from './pages/DevChecklist';

export const router = createBrowserRouter([
  // Public auth routes
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/unauthorized', Component: UnauthorizedPage },

  // Protected app shell
  {
    path: '/',
    Component: AppLayout,
    children: [
      // Root redirect
      { index: true, Component: RootRedirect },

      // CLIENT routes
      { path: 'client/vehicles',               Component: VehiclesPage },
      { path: 'client/bookings',               Component: ClientBookingsPage },
      { path: 'client/bookings/:bookingId',    Component: ClientBookingDetailPage },

      // MECHANIC routes
      { path: 'mechanic/pending',              Component: PendingBookingsPage },
      { path: 'mechanic/bookings',             Component: MyBookingsPage },
      { path: 'mechanic/bookings/:bookingId',  Component: MechanicBookingDetailPage },

      // Dev tools (remove in production)
      { path: 'dev/checklist',                 Component: DevChecklist },
    ],
  },

  // 404
  { path: '*', Component: NotFoundPage },
]);