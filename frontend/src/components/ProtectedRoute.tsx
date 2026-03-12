import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    children?: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');

    if (!userData) {
        // Redirect to login page if not authenticated
        return <Navigate to="/login" replace />;
    }

    // Check if setup is completed
    try {
        const parsed = JSON.parse(userData);
        if (parsed?.user && !parsed.user.setupCompleted) {
            // User is logged in but hasn't completed setup
            return <Navigate to="/setup" replace />;
        }
    } catch {
        // If we can't parse the data, redirect to login
        return <Navigate to="/login" replace />;
    }

    // If authenticated and setup done, render children or Outlet
    return children ? <>{children}</> : <Outlet />;
};
