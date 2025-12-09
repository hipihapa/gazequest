import { Navigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { cameraPermission } = useGameStore();

    // If camera permission is not granted, redirect to permission page
    if (cameraPermission !== true) {
        return <Navigate to="/permission" replace />;
    }

    // If permission is granted, render the protected content
    return <>{children}</>;
};
