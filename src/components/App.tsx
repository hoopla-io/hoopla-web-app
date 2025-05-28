import { useMemo } from "react";
import { Navigate, Route, Routes, HashRouter } from "react-router-dom";
import {
  retrieveLaunchParams,
  useSignal,
  isMiniAppDark,
} from "@telegram-apps/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";

import { routes } from "@/navigation/routes";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/context/protected.context";

export function App() {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);

  return (
    <AppRoot
      appearance={isDark ? "dark" : "light"}
      platform={["macos", "ios"].includes(lp.tgWebAppPlatform) ? "ios" : "base"}
    >
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
    </AppRoot>
  );
}
