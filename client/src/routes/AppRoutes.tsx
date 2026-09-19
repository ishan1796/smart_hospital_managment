import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { LoginPage } from "../pages/LoginPage";
import { PatientPortalPage } from "../pages/PatientPortalPage";
import { DoctorDashboardPage } from "../pages/DoctorDashboardPage";
import { NurseDashboardPage } from "../pages/NurseDashboardPage";
import { PharmacyPage } from "../pages/PharmacyPage";
import { LaboratoryPage } from "../pages/LaboratoryPage";
import { IpdBedManagementPage } from "../pages/IpdBedManagementPage";
import { FinancePage } from "../pages/FinancePage";
import { InventoryPage } from "../pages/InventoryPage";
import { HrmsPage } from "../pages/HrmsPage";
import { MessDietPage } from "../pages/MessDietPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AiChatPage } from "../pages/AiChatPage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { UserRole } from "../types";

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner label="Authenticating session..." /></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's permitted home
    const homeRoutes: Record<UserRole, string> = {
      ADMIN: "/admin",
      DOCTOR: "/doctor",
      NURSE: "/nurse",
      PATIENT: "/patient",
      PHARMACY: "/pharmacy",
      LAB: "/lab",
      FINANCE: "/finance",
      HRMS: "/hrms",
      MESS: "/mess",
    };
    return <Navigate to={homeRoutes[user.role] || "/login"} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner label="Initializing AegisCare..." /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Patient Portal */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute allowedRoles={["PATIENT", "ADMIN"]}>
            <PatientPortalPage />
          </ProtectedRoute>
        }
      />

      {/* Doctor Dashboard */}
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute allowedRoles={["DOCTOR", "ADMIN"]}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Nurse Station */}
      <Route
        path="/nurse/*"
        element={
          <ProtectedRoute allowedRoles={["NURSE", "ADMIN"]}>
            <NurseDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Pharmacy */}
      <Route
        path="/pharmacy/*"
        element={
          <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
            <PharmacyPage />
          </ProtectedRoute>
        }
      />

      {/* Laboratory */}
      <Route
        path="/lab/*"
        element={
          <ProtectedRoute allowedRoles={["LAB", "ADMIN"]}>
            <LaboratoryPage />
          </ProtectedRoute>
        }
      />

      {/* IPD & Bed Management */}
      <Route
        path="/ipd/*"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "DOCTOR", "NURSE"]}>
            <IpdBedManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Finance & Billing */}
      <Route
        path="/finance/*"
        element={
          <ProtectedRoute allowedRoles={["FINANCE", "ADMIN"]}>
            <FinancePage />
          </ProtectedRoute>
        }
      />

      {/* Inventory & Oxygen */}
      <Route
        path="/inventory/*"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "PHARMACY", "LAB", "MESS", "NURSE"]}>
            <InventoryPage />
          </ProtectedRoute>
        }
      />

      {/* HRMS */}
      <Route
        path="/hrms/*"
        element={
          <ProtectedRoute allowedRoles={["HRMS", "ADMIN"]}>
            <HrmsPage />
          </ProtectedRoute>
        }
      />

      {/* Mess & Diet */}
      <Route
        path="/diet/*"
        element={
          <ProtectedRoute allowedRoles={["MESS", "ADMIN", "DOCTOR", "NURSE"]}>
            <MessDietPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mess/*"
        element={
          <ProtectedRoute allowedRoles={["MESS", "ADMIN", "DOCTOR", "NURSE"]}>
            <MessDietPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* AI Assistant & Copilot */}
      <Route
        path="/ai-chat"
        element={
          <ProtectedRoute>
            <AiChatPage />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                user.role === "ADMIN"
                  ? "/admin"
                  : user.role === "DOCTOR"
                  ? "/doctor"
                  : user.role === "NURSE"
                  ? "/nurse"
                  : user.role === "PATIENT"
                  ? "/patient"
                  : user.role === "PHARMACY"
                  ? "/pharmacy"
                  : user.role === "LAB"
                  ? "/lab"
                  : user.role === "FINANCE"
                  ? "/finance"
                  : user.role === "HRMS"
                  ? "/hrms"
                  : "/mess"
              }
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
