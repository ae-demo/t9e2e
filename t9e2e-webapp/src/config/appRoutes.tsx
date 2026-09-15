import { Navigate, useLocation, type RouteProps } from "react-router";
import { AuthProvider } from "../AuthGate";
import AppLayout from "../layouts/AppLayout";
import CallbackPage from "../pages/CallbackPage";
import TaskBoardPage from "../pages/TaskBoardPage";
import NewTaskPage from "../pages/NewTaskPage";

export interface AppRoute extends Omit<RouteProps, "children"> {
  children?: AppRoute[];
  label?: string;
}

// An unmatched path redirects to the board — carrying the current query
// string forward (mock mode's ?role=/?auth= live there) so the bounce doesn't
// silently drop the caller's identity, the same way the in-app navigations do.
function RedirectHome() {
  const location = useLocation();
  return <Navigate to={{ pathname: "/", search: location.search }} replace />;
}

const appRoutes: AppRoute[] = [
  // The one screen with no auth dependency's chrome: it exists to complete
  // sign-in, never to gate it (thunder-authentication).
  { path: "/callback", element: <CallbackPage /> },
  {
    element: (
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    ),
    children: [
      { path: "/", element: <TaskBoardPage /> },
      { path: "/new-task", element: <NewTaskPage /> },
      { path: "*", element: <RedirectHome /> },
    ],
  },
];

export default appRoutes;
