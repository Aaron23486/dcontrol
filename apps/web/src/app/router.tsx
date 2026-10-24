import { Navigate, createBrowserRouter } from 'react-router';
import { AppLayout } from '../components/templates/AppLayout';
import { RequireSession } from '../features/auth/RequireSession';
import { DEFAULT_SECTION } from '../features/persons/person-sections';
import { AuditPage } from '../pages/AuditPage';
import { HistoryPage } from '../pages/HistoryPage';
import { InsidePage } from '../pages/InsidePage';
import { ScanPage } from '../pages/ScanPage';
import { VisitDetailPage } from '../pages/VisitDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { NewPersonPage } from '../pages/NewPersonPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PersonDetailPage } from '../pages/PersonDetailPage';
import { PersonsPage } from '../pages/PersonsPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';

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
          { path: 'dentro', element: <InsidePage /> },
          {
            path: 'historial',
            element: <Navigate to={`/historial/${DEFAULT_SECTION.slug}`} replace />,
          },
          { path: 'historial/visita/:id', element: <VisitDetailPage /> },
          { path: 'historial/:section', element: <HistoryPage /> },
          { path: 'auditoria', element: <AuditPage /> },
          { path: '*', element: <NotFoundPage /> },
          {
            path: 'personas',
            element: <Navigate to={`/personas/${DEFAULT_SECTION.slug}`} replace />,
          },
          { path: 'personas/detalle/:id', element: <PersonDetailPage /> },
          { path: 'personas/:section', element: <PersonsPage /> },
          { path: 'personas/:section/nueva', element: <NewPersonPage /> },
        ],
      },
    ],
  },
]);
