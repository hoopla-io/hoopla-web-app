import { Navigate, Route, Routes, HashRouter } from "react-router-dom";

import { routes } from "@/navigation/routes";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/context/protected.context";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          {routes.map((route) => {
            if (route.protected) {
              return (
                <Route
                  key={route.path}
                  {...route}
                  element={<ProtectedRoute>{route.element}</ProtectedRoute>}
                />
              );
            }

            return <Route key={route.path} {...route} />;
          })}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
