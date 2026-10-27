import { Navigate, createBrowserRouter } from 'react-router';
import { AppLayout } from '../components/templates/AppLayout';
import { RequireSession } from '../features/auth/RequireSession';
import { DEFAULT_SECTION } from '../features/persons/person-sections';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { ScanPage } from '../pages/ScanPage';

// El login y «Ingreso y salida» van en el paquete inicial: son lo primero que abre la caseta.
// El resto de las pantallas se descarga al entrar en ellas (un archivo por pantalla).
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    element: <RequireSession />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <ScanPage /> },
          {
            path: 'dentro',
            lazy: () => import('../pages/InsidePage').then((m) => ({ Component: m.InsidePage })),
          },
          {
            path: 'historial',
            element: <Navigate to={`/historial/${DEFAULT_SECTION.slug}`} replace />,
          },
          {
            path: 'historial/visita/:id',
            lazy: () =>
              import('../pages/VisitDetailPage').then((m) => ({ Component: m.VisitDetailPage })),
          },
          {
            path: 'historial/:section',
            lazy: () => import('../pages/HistoryPage').then((m) => ({ Component: m.HistoryPage })),
          },
          {
            path: 'auditoria',
            lazy: () => import('../pages/AuditPage').then((m) => ({ Component: m.AuditPage })),
          },
          { path: '*', element: <NotFoundPage /> },
          {
            path: 'personas',
            element: <Navigate to={`/personas/${DEFAULT_SECTION.slug}`} replace />,
          },
          {
            path: 'personas/detalle/:id',
            lazy: () =>
              import('../pages/PersonDetailPage').then((m) => ({ Component: m.PersonDetailPage })),
          },
          {
            path: 'personas/:section',
            lazy: () => import('../pages/PersonsPage').then((m) => ({ Component: m.PersonsPage })),
          },
          {
            path: 'personas/:section/nueva',
            lazy: () =>
              import('../pages/NewPersonPage').then((m) => ({ Component: m.NewPersonPage })),
          },
        ],
      },
    ],
  },
]);
