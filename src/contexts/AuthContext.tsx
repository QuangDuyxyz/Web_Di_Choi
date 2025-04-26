
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  useEffect(() => {
    // Check for saved user in localStorage (mock authentication persistence)
    const savedUser = localStorage.getItem('friendverse-user');
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to parse saved user', error);
        localStorage.removeItem('friendverse-user');
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication - in a real app, you would validate with a backend
    const user = mockUsers.find(u => u.username === username);
    
    // Simple mock authentication (in a real app, you would check the password)
    if (user) {
      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false
      });
      localStorage.setItem('friendverse-user', JSON.stringify(user));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });
    localStorage.removeItem('friendverse-user');
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAdmin: authState.user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
