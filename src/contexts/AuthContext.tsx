import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthState, RegisterFormData } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';

// Safely initialize Supabase with environment variables or fallback to empty strings
// to prevent runtime errors, but this will still require proper setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        getUserProfile(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        getUserProfile(session.user.id);
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
      return;
    }

    setAuthState({
      isAuthenticated: true,
      user: data,
      isLoading: false
    });
  };

  const register = async (data: RegisterFormData): Promise<boolean> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username: data.username,
              display_name: data.displayName,
              birthdate: data.birthdate,
              role: 'user',
              avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${data.username}`,
            },
          ]);

        if (profileError) throw profileError;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (user: User) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        username: user.username,
        display_name: user.displayName,
        birthdate: user.birthdate,
      })
      .eq('id', user.id);

    if (error) throw error;

    if (user.id === authState.user?.id) {
      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, ...user }
      }));
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        isAdmin: authState.user?.role === 'admin',
        updateUser,
        deleteUser,
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
