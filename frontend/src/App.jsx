import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import scadaRoutes from './router/scadaRoutes';
import ScadaLayout from './layouts/ScadaLayout';
import ScadaLoginPage from './pages/scada/ScadaLoginPage';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';

function renderRoutes(routeList) {
  return routeList.map((route) => {
    const Element = route.element;
    return (
      <Route
        key={route.path ?? 'index'}
        index={route.index}
        path={route.path}
        element={<Element />}
      />
    );
  });
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<ScadaLoginPage />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <ScadaLayout />
              </RequireAuth>
            }
          >
            {renderRoutes(scadaRoutes)}
          </Route>

          {/* 예전 /scada/* 주소로 들어와도 새 주소로 보낸다 */}
          <Route path="/scada/*" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
