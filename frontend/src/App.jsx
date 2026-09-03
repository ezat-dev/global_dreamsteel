import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import scadaRoutes from './router/scadaRoutes';
import ScadaLayout from './layouts/ScadaLayout';
import ScadaLoginPage from './pages/scada/ScadaLoginPage';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import { AuthProvider } from './context/AuthContext';

function renderRoutes(routeList) {
  return routeList.map((route) => {
    const Element = route.element;
    /* adminOnly 화면은 한 겹 더 감싼다 — 메뉴에서 감추는 것만으로는 주소를 직접
       쳐서 들어갈 수 있다. 관리자가 아니면 RequireAdmin이 메인화면으로 되돌린다. */
    const element = route.adminOnly
      ? <RequireAdmin><Element /></RequireAdmin>
      : <Element />;

    return (
      <Route
        key={route.path ?? 'index'}
        index={route.index}
        path={route.path}
        element={element}
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
