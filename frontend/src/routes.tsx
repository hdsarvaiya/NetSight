import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { SignUpPage } from "./pages/SignUpPage";
import { LoginPage } from "./pages/LoginPage";
import { SetupWizard } from "./pages/SetupWizard";
import { Dashboard } from "./pages/Dashboard";
import { TopologyPage } from "./pages/TopologyPage";
import { DevicesPage } from "./pages/DevicesPage";
import { DeviceDetailsPage } from "./pages/DeviceDetailsPage";
import { NetworkAnalyticsPage } from "./pages/NetworkAnalyticsPage";
import { FailurePredictionPage } from "./pages/FailurePredictionPage";
import { AlertsPage } from "./pages/AlertsPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: LandingPage,
    },
    {
        path: "/signup",
        Component: SignUpPage,
    },
    {
        path: "/verify-email",
        Component: VerifyEmailPage,
    },
    {
        path: "/login",
        Component: LoginPage,
    },
    {
        path: "/setup",
        Component: SetupWizard,
    },
    {
        path: "/app",
        element: (
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, Component: Dashboard },
            { path: "topology", Component: TopologyPage },
            { path: "devices", Component: DevicesPage },
            { path: "devices/:deviceId", Component: DeviceDetailsPage },
            { path: "analytics", Component: NetworkAnalyticsPage },
            { path: "prediction", Component: FailurePredictionPage },
            { path: "alerts", Component: AlertsPage },
            { path: "users", Component: UserManagementPage },
            { path: "settings", Component: SettingsPage },
            { path: "audit", Component: AuditLogsPage },
        ],
    },
]);
