import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from './AuthDialog';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  if (!isAuthenticated) {
    return (
      <AuthDialog
        isOpen={true}
        onClose={() => {}} // Can't close when protecting route
        mode={authMode}
        onModeChange={setAuthMode}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
