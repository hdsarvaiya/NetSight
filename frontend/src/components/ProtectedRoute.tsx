import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    children?: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    // Check if user is logged in
    // We check for 'user' object or 'token' in localStorage
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!user && !token) {
        // Redirect to login page if not authenticated
        // replace: true ensures the user can't go back to the protected page using browser back button
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render children or Outlet
    return children ? <>{children}</> : <Outlet />;
};
