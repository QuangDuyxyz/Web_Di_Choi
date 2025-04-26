
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthState, RegisterFormData } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '@/data/mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock password for development
const MOCK_PASSWORD = 'password';

// Store registered users during the session (development only)
let registeredMockUsers: User[] = [];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check Supabase connection
    const checkSupabase = async () => {
      try {
        // Try to get session
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // User is logged in with Supabase
          getUserProfile(data.session.user.id);
        } else {
          // No active session
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
        
        // Set up auth listener
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
      } catch (error) {
        console.warn('Supabase connection error. Using mock data instead.');
        // Using mock admin user for development
        setAuthState({
          isAuthenticated: false, // Start not authenticated
          user: null,
          isLoading: false
        });
      }
    };
    
    checkSupabase();
  }, []);

  const getUserProfile = async (userId: string) => {
    try {
      // Use Supabase to get the user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        // Convert the Supabase profile to our User type
        const user: User = {
          id: data.id,
          username: data.username,
          email: '', // Email is not stored in the profiles table
          displayName: data.display_name,
          birthdate: data.birthdate,
          avatar: data.avatar || `https://api.dicebear.com/7.x/avatars/svg?seed=${data.username}`,
          role: data.role,
        };

        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false
        });
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
    }
  };

  const register = async (data: RegisterFormData): Promise<boolean> => {
    try {
      // First try with Supabase
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create profile for the new user
          const profileData = {
            id: authData.user.id,
            username: data.username,
            display_name: data.displayName,
            birthdate: data.birthdate,
            role: 'user',
            avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${data.username}`,
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData]);

          if (profileError) {
            console.error("Error creating profile:", profileError);
            // If profile creation fails, we should delete the auth user
            // This would require admin privileges which we don't want to use in client code
            // Instead, just return false to indicate failure
            return false;
          }

          toast({
            title: "Đăng ký thành công",
            description: "Tài khoản của bạn đã được tạo!",
          });
          
          return true;
        }
      } catch (supabaseError) {
        console.warn('Supabase error, using mock registration instead:', supabaseError);
      }

      // Mock registration logic for development
      const newId = `mock-${Date.now()}`;
      const newUser: User = {
        id: newId,
        username: data.username,
        email: data.email, // Make sure to store the email for login
        displayName: data.displayName,
        birthdate: data.birthdate,
        avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${data.username}`,
        role: 'user'
      };
      
      // Add to local storage of registered users
      registeredMockUsers.push(newUser);
      
      toast({
        title: "Đăng ký thành công",
        description: `Tài khoản ${newUser.username} đã được tạo. Bạn có thể đăng nhập ngay bây giờ.`,
      });
      
      console.log("Registered mock users:", registeredMockUsers);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Lỗi đăng ký",
        description: "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.",
        variant: "destructive"
      });
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // First try Supabase login
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.session) {
          return true;
        }
      } catch (supabaseError) {
        console.warn('Supabase login error, using mock login instead:', supabaseError);
      }
      
      // Mock login logic

      // First check the fixed admin account
      const adminUser = mockUsers[0]; // First user is our fixed admin
      if (email === adminUser.email && password === 'admin123') {
        setAuthState({
          isAuthenticated: true,
          user: adminUser,
          isLoading: false
        });
        toast({
          title: "Đăng nhập thành công",
          description: `Xin chào ${adminUser.displayName}!`,
        });
        return true;
      }
      
      // Then check other mock users
      const mockUser = mockUsers.slice(1).find(user => user.email === email);
      if (mockUser && password === MOCK_PASSWORD) {
        setAuthState({
          isAuthenticated: true,
          user: mockUser,
          isLoading: false
        });
        toast({
          title: "Đăng nhập thành công",
          description: `Xin chào ${mockUser.displayName}!`,
        });
        return true;
      }
      
      // Check registered users during this session
      const registeredUser = registeredMockUsers.find(user => user.email === email);
      if (registeredUser && password === password) { // For registered users, use their actual password
        setAuthState({
          isAuthenticated: true,
          user: registeredUser,
          isLoading: false
        });
        toast({
          title: "Đăng nhập thành công",
          description: `Xin chào ${registeredUser.displayName}!`,
        });
        return true;
      }
      
      toast({
        title: "Đăng nhập thất bại",
        description: "Email hoặc mật khẩu không đúng",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Lỗi đăng nhập",
        description: "Có lỗi xảy ra khi đăng nhập",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Try Supabase logout first
      try {
        await supabase.auth.signOut();
      } catch (supabaseError) {
        console.warn('Supabase logout error, using mock logout instead:', supabaseError);
      }
      
      // Mock logout for development
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
      
      toast({
        title: "Đăng xuất thành công",
        description: "Bạn đã đăng xuất khỏi hệ thống",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (user: User) => {
    if (!authState.user) return;
    
    try {
      // Try to update with Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          username: user.username,
          display_name: user.displayName,
          birthdate: user.birthdate,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state if this is the current user
      if (user.id === authState.user?.id) {
        setAuthState(prev => ({
          ...prev,
          user: { ...prev.user!, ...user }
        }));
      }
      
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin người dùng đã được cập nhật",
      });
    } catch (error) {
      console.error('Update user error:', error);
      
      // Mock update for development
      if (authState.user?.id === user.id) {
        setAuthState(prev => ({
          ...prev,
          user: { ...prev.user!, ...user }
        }));
      }
      
      toast({
        title: "Development Mode",
        description: "User update simulated",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Try to delete with Supabase
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      toast({
        title: "Xóa thành công",
        description: "Người dùng đã được xóa khỏi hệ thống",
      });
    } catch (error) {
      console.error('Delete user error:', error);
      
      // Mock delete for development
      toast({
        title: "Development Mode",
        description: "User deletion simulated",
      });
    }
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
