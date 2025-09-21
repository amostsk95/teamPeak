import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing auth cookie on mount
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('peakAuth='));
    
    const userCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('peakUser='));
    
    if (authCookie && userCookie) {
      setIsAuthenticated(true);
      setUsername(decodeURIComponent(userCookie.split('=')[1]));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === 'peakAdmin' && password === '12345') {
      // Set cookies for 24 hours
      const expires = new Date();
      expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
      document.cookie = `peakAuth=true; expires=${expires.toUTCString()}; path=/`;
      document.cookie = `peakUser=${encodeURIComponent(username)}; expires=${expires.toUTCString()}; path=/`;
      
      setIsAuthenticated(true);
      setUsername(username);
      return true;
    }
    return false;
  };

  const logout = () => {
    // Clear cookies
    document.cookie = 'peakAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'peakUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
