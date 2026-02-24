import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import KioskHome from "./pages/kiosk/KioskHome";
import KioskCheckout from "./pages/kiosk/KioskCheckout";
import KioskSuccess from "./pages/kiosk/KioskSuccess";
import Reservations from "./pages/admin/Reservations";
import ActiveLoans from "./pages/admin/ActiveLoans";
import LoanHistory from "./pages/admin/LoanHistory";
import Devices from "./pages/admin/Devices";
import StaffManagement from "./pages/admin/StaffManagement";

function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isKioskMode } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">Loading...</div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (isKioskMode) return <Navigate to="/kiosk" replace />;
  if (adminOnly && user.role !== "admin")
    return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, isKioskMode } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">Loading...</div>
    );

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            isKioskMode ? (
              <Navigate to="/kiosk" replace />
            ) : (
              <Navigate to="/admin" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          user && !isKioskMode ? <Navigate to="/admin" replace /> : <Login />
        }
      />

      {/* Kiosk routes — accessible without login */}
      <Route path="/kiosk" element={<KioskHome />} />
      <Route path="/kiosk/checkout" element={<KioskCheckout />} />
      <Route path="/kiosk/success" element={<KioskSuccess />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <ProtectedRoute>
            <Reservations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/loans"
        element={
          <ProtectedRoute>
            <ActiveLoans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/history"
        element={
          <ProtectedRoute>
            <LoanHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/devices"
        element={
          <ProtectedRoute adminOnly>
            <Devices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute adminOnly>
            <StaffManagement />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
