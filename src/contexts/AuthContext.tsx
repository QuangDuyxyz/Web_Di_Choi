import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState, RegisterFormData, UserRole } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers, MOCK_PASSWORD, MOCK_ADMIN_PASSWORD } from '@/data/mockData';
import { SyncService } from '@/lib/syncService';
import { FirebaseService } from '@/services/firebaseService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateUser: (user: User) => Promise<void>;
  updateAvatar: (userId: string, avatarUrl: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sử dụng MOCK_PASSWORD và MOCK_ADMIN_PASSWORD từ mockData.ts

// Khai báo kiểu cho window để thêm thuộc tính registeredMockUsers
declare global {
  interface Window {
    registeredMockUsers: User[];
  }
}

// Store registered users with passwords (development only)
// Khôi phục dữ liệu từ localStorage nếu có

// Tạo kiểu dữ liệu cho người dùng kèm mật khẩu
type RegisteredUserWithPassword = User & { password: string };

declare global {
  interface Window {
    registeredMockUsers: User[];
    registeredUserPasswords: Record<string, string>; // Lưu mật khẩu dưới dạng { userId: password }
  }
}

// Đọc dữ liệu từ Firebase trước
const initializeUsersFromFirebase = async () => {
  try {
    // Lấy dữ liệu từ Firebase
    const firebaseData = await FirebaseService.getData();
    
    if (firebaseData && firebaseData.users && firebaseData.users.length > 0 && firebaseData.passwords) {
      window.registeredMockUsers = firebaseData.users;
      window.registeredUserPasswords = firebaseData.passwords;
      
      // Lưu vào localStorage để sử dụng offline
      localStorage.setItem('registeredMockUsers', JSON.stringify(firebaseData.users));
      localStorage.setItem('registeredUserPasswords', JSON.stringify(firebaseData.passwords));
      
      console.log('Loaded users and passwords from Firebase:', {
        users: window.registeredMockUsers.length,
        passwords: Object.keys(window.registeredUserPasswords || {}).length
      });
    } else {
      // Nếu không có dữ liệu từ Firebase, thử từ localStorage
      const savedUsers = localStorage.getItem('registeredMockUsers');
      window.registeredMockUsers = savedUsers ? JSON.parse(savedUsers) : [];
      
      const savedPasswords = localStorage.getItem('registeredUserPasswords');
      window.registeredUserPasswords = savedPasswords ? JSON.parse(savedPasswords) : {};
      
      // Đồng bộ lên Firebase nếu có dữ liệu
      if (window.registeredMockUsers.length > 0) {
        await FirebaseService.saveData({
          users: window.registeredMockUsers,
          passwords: window.registeredUserPasswords
        });
      }
      
      console.log('Loaded users and passwords from localStorage:', {
        users: window.registeredMockUsers.length,
        passwords: Object.keys(window.registeredUserPasswords || {}).length
      });
    }
  } catch (error) {
    console.error('Error initializing users:', error);
    
    // Fallback to localStorage
    const savedUsers = localStorage.getItem('registeredMockUsers');
    window.registeredMockUsers = savedUsers ? JSON.parse(savedUsers) : [];
    
    const savedPasswords = localStorage.getItem('registeredUserPasswords');
    window.registeredUserPasswords = savedPasswords ? JSON.parse(savedPasswords) : {};
  }
};

try {
  // Khởi tạo dữ liệu tạm thời từ localStorage
  const savedUsers = localStorage.getItem('registeredMockUsers');
  window.registeredMockUsers = savedUsers ? JSON.parse(savedUsers) : [];
  
  const savedPasswords = localStorage.getItem('registeredUserPasswords');
  window.registeredUserPasswords = savedPasswords ? JSON.parse(savedPasswords) : {};
  
  // Sau đó khởi tạo từ Firebase (đồng bộ)
  initializeUsersFromFirebase();
} catch (error) {
  console.error('Error loading registered users:', error);
  window.registeredMockUsers = [];
  window.registeredUserPasswords = {};
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Khởi tạo trạng thái xác thực từ localStorage nếu có
  const initAuthState = (): AuthState => {
    try {
      const savedAuthState = localStorage.getItem('authState');
      if (savedAuthState) {
        const parsedState = JSON.parse(savedAuthState);
        console.log('Restoring auth state from localStorage:', parsedState);
        
        // Thêm kiểm tra tính hợp lệ của trạng thái được khôi phục
        if (parsedState && typeof parsedState.isAuthenticated === 'boolean') {
          // Thêm lọc để đảm bảo có user khi isAuthenticated là true
          if (parsedState.isAuthenticated && !parsedState.user) {
            console.warn('Found invalid auth state: isAuthenticated true but no user');
            return {
              isAuthenticated: false,
              user: null,
              isLoading: true
            };
          }
          
          // Kiểm tra xem user có tồn tại trong danh sách người dùng đã đăng ký không
          if (parsedState.isAuthenticated && parsedState.user) {
            const userId = parsedState.user.id;
            
            // Nếu là admin thì cho phép đăng nhập
            if (userId === mockUsers[0].id) {
              return {
                ...parsedState,
                isLoading: false
              };
            }
            
            // Nếu là người dùng đã đăng ký, kiểm tra xem có trong danh sách không
            const existingUser = window.registeredMockUsers.find(u => u.id === userId);
            if (!existingUser) {
              console.warn('User in auth state not found in registered users:', userId);
              return {
                isAuthenticated: false,
                user: null,
                isLoading: false
              };
            }
            
            // Kiểm tra và khôi phục ảnh đại diện từ Firebase nếu có
            FirebaseService.getData().then(data => {
              if (data && data.userAvatars && parsedState.user) {
                const avatarFromFirebase = data.userAvatars[userId];
                if (avatarFromFirebase) {
                  parsedState.user.avatar = avatarFromFirebase;
                  console.log('Restored avatar from Firebase for user:', userId);
                  
                  // Cập nhật state nếu người dùng đang đăng nhập
                  if (authState.isAuthenticated && authState.user && authState.user.id === userId) {
                    setAuthState(prev => ({
                      ...prev,
                      user: { ...prev.user!, avatar: avatarFromFirebase }
                    }));
                  }
                }
              }
            }).catch(error => {
              console.error('Error getting avatar from Firebase:', error);
            });
            
            return {
              ...parsedState,
              isLoading: false // Đã load xong
            };
          }
        }
      }
    } catch (error) {
      console.error('Error loading auth state from localStorage:', error);
    }
    return {
      isAuthenticated: false,
      user: null,
      isLoading: true
    };
  };
  
  const [authState, setAuthState] = useState<AuthState>(initAuthState());
  const { toast } = useToast();
  
  // Sử dụng Firebase lắng nghe thay đổi để đồng bộ dữ liệu người dùng giữa các thiết bị
  useEffect(() => {
    // Thiết lập lắng nghe thay đổi dữ liệu từ Firebase
    const unsubscribe = FirebaseService.subscribe((data) => {
      if (data.users && data.users.length > 0) {
        // Cập nhật danh sách người dùng mới từ Firebase
        const syncedUsers = data.users;
        const syncedPasswords = data.passwords || {};
        
        // Kết hợp với dữ liệu hiện tại
        const mergedUsers = FirebaseService.mergeArrays(window.registeredMockUsers, syncedUsers);
        
        // Cập nhật danh sách người dùng đồng bộ
        window.registeredMockUsers = mergedUsers;
        window.registeredUserPasswords = { ...window.registeredUserPasswords, ...syncedPasswords };
        
        // Lưu vào localStorage
        localStorage.setItem('registeredMockUsers', JSON.stringify(mergedUsers));
        localStorage.setItem('registeredUserPasswords', JSON.stringify(window.registeredUserPasswords));
        
        console.log('Updated users from Firebase:', {
          users: mergedUsers.length,
          passwords: Object.keys(window.registeredUserPasswords).length
        });
      }
      
      // Cập nhật ảnh đại diện nếu có
      if (data.userAvatars && authState.user) {
        const userId = authState.user.id;
        const newAvatar = data.userAvatars[userId];
        
        if (newAvatar && newAvatar !== authState.user.avatar) {
          // Cập nhật ảnh đại diện cho người dùng đang đăng nhập
          setAuthState(prev => ({
            ...prev,
            user: prev.user ? { ...prev.user, avatar: newAvatar } : null
          }));
        }
      }
    });
    
    // Dọn dẹp khi component unmount
    return () => {
      unsubscribe();
    };
  }, [authState.user]);
  
  // Lưu trạng thái xác thực vào localStorage khi thay đổi
  useEffect(() => {
    if (!authState.isLoading) { // Chỉ lưu khi đã hoàn tất quá trình kiểm tra
      try {
        console.log('Saving auth state to localStorage:', authState);
        localStorage.setItem('authState', JSON.stringify(authState));
        
        // Kiểm tra ngay sau khi lưu để đảm bảo dữ liệu đã được lưu đúng
        const savedState = localStorage.getItem('authState');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.isAuthenticated !== authState.isAuthenticated) {
            console.error('Auth state not saved correctly!');
          }
        }
        
        // Lưu ảnh đại diện của người dùng vào cloud khi họ đăng nhập
        if (authState.isAuthenticated && authState.user && authState.user.avatar) {
          FirebaseService.saveData({
            userAvatars: { [authState.user.id]: authState.user.avatar }
          });
        }
      } catch (error) {
        console.error('Error saving auth state to localStorage:', error);
      }
    }
  }, [authState]);

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
          role: (data.role as UserRole) || 'user',
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
      // Kiểm tra xem email đã tồn tại trong danh sách người dùng đã đăng ký chưa
      // Kiểm tra không phân biệt chữ hoa/thường
      const existingUser = window.registeredMockUsers.find(
        user => user.email.toLowerCase() === data.email.toLowerCase()
      );
      
      if (existingUser) {
        toast({
          title: "Email đã tồn tại",
          description: "Email này đã được sử dụng. Vui lòng sử dụng email khác.",
          variant: "destructive"
        });
        return false;
      }

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
            role: 'user' as const, // Đặt kiểu cụ thể cho role
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
      
      // Khởi tạo window.registeredUserPasswords nếu chưa có
      if (!window.registeredUserPasswords) {
        window.registeredUserPasswords = {};
      }
      
      // Lưu mật khẩu riêng biệt
      window.registeredUserPasswords[newId] = data.password;
      
      // Lưu ảnh đại diện vào Firebase
      FirebaseService.saveData({
        userAvatars: { [newId]: newUser.avatar }
      });
      
      // Add to local storage of registered users
      window.registeredMockUsers.push(newUser);
            // Lưu vào localStorage để dữ liệu không bị mất khi làm mới trang
      try {
        // Lưu danh sách người dùng
        localStorage.setItem('registeredMockUsers', JSON.stringify(window.registeredMockUsers));
        
        // Lưu danh sách mật khẩu
        localStorage.setItem('registeredUserPasswords', JSON.stringify(window.registeredUserPasswords));
        
        // Đồng bộ với các thiết bị khác qua Firebase
        FirebaseService.saveData({
          users: window.registeredMockUsers,
          passwords: window.registeredUserPasswords
        });
      } catch (error) {
        console.error('Error saving registered users to localStorage:', error);
      }
      
      // Đăng nhập tự động sau khi đăng ký
      setAuthState({
        isAuthenticated: true,
        user: newUser,
        isLoading: false
      });
      
      toast({
        title: "Đăng ký thành công",
        description: `Chào mừng ${newUser.displayName} đã tham gia FriendVerse!`,
      });
      
      console.log("Registered mock users:", window.registeredMockUsers);
      console.log("Stored passwords for users:", Object.keys(window.registeredUserPasswords).length);
      
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
          // Đăng nhập thành công với Supabase
          // Lấy thông tin profile của người dùng
          await getUserProfile(data.user.id);
          return true;
        }
      } catch (supabaseError) {
        console.warn('Supabase login error, using mock login instead:', supabaseError);
      }
      
      // Mock login logic

      // First check the fixed admin account
      const adminUser = mockUsers[0]; // First user is our fixed admin
      if (email === adminUser.email && password === MOCK_ADMIN_PASSWORD) {
        // Kiểm tra xem có ảnh đại diện được lưu không
        const savedAvatar = SyncService.getUserAvatar(adminUser.id); // Fallback to SyncService
        const userWithAvatar = {
          ...adminUser,
          avatar: savedAvatar || adminUser.avatar
        };
        
        setAuthState({
          isAuthenticated: true,
          user: userWithAvatar,
          isLoading: false
        });
        
        // Lưu ảnh đại diện lên Firebase
        if (userWithAvatar.avatar) {
          FirebaseService.saveData({
            userAvatars: { [adminUser.id]: userWithAvatar.avatar }
          });
        }
        
        toast({
          title: "Đăng nhập thành công",
          description: `Xin chào ${adminUser.displayName}!`,
        });
        return true;
      }
      
      // Then check other mock users
      const mockUser = mockUsers.slice(1).find(user => user.email === email);
      if (mockUser && password === MOCK_PASSWORD) {
        // Kiểm tra xem có ảnh đại diện được lưu không
        const savedAvatar = SyncService.getUserAvatar(mockUser.id); // Fallback to SyncService
        const userWithAvatar = {
          ...mockUser,
          avatar: savedAvatar || mockUser.avatar
        };
        
        setAuthState({
          isAuthenticated: true,
          user: userWithAvatar,
          isLoading: false
        });
        
        // Lưu ảnh đại diện lên Firebase
        if (userWithAvatar.avatar) {
          FirebaseService.saveData({
            userAvatars: { [mockUser.id]: userWithAvatar.avatar }
          });
        }
        
        toast({
          title: "Đăng nhập thành công",
          description: `Xin chào ${mockUser.displayName}!`,
        });
        return true;
      }
      
      // Check registered users during this session
      console.log('Checking registered users:', window.registeredMockUsers);
      console.log('Looking for email:', email);
      const registeredUser = window.registeredMockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
      console.log('Found user:', registeredUser);
      
      if (registeredUser) {
        // Kiểm tra mật khẩu cho người dùng đã đăng ký
        // Lấy mật khẩu đã lưu
        const storedPassword = window.registeredUserPasswords?.[registeredUser.id];
        
        if (!storedPassword) {
          console.warn('No password found for user:', registeredUser.id);
          toast({
            title: "Đăng nhập thất bại",
            description: "Tài khoản không hợp lệ. Vui lòng kiểm tra lại thông tin đăng nhập.",
            variant: "destructive"
          });
          return false;
        }
        
        // So sánh mật khẩu
        if (password === storedPassword) {
          // Kiểm tra ảnh đại diện từ Firebase (fallback to SyncService)
          const savedAvatar = SyncService.getUserAvatar(registeredUser.id);
          
          // Sử dụng ảnh đại diện từ Firebase nếu có, nếu không thì dùng ảnh hiện tại
          const userWithAvatar = {
            ...registeredUser,
            avatar: savedAvatar || registeredUser.avatar
          };
          
          // Cập nhật ảnh đại diện trong danh sách người dùng đã đăng ký
          if (savedAvatar && registeredUser.avatar !== savedAvatar) {
            const userIndex = window.registeredMockUsers.findIndex(u => u.id === registeredUser.id);
            if (userIndex >= 0) {
              window.registeredMockUsers[userIndex].avatar = savedAvatar;
              localStorage.setItem('registeredMockUsers', JSON.stringify(window.registeredMockUsers));
            }
          }
          
          setAuthState({
            isAuthenticated: true,
            user: userWithAvatar,
            isLoading: false
          });
          
          // Đảm bảo ảnh đại diện được lưu lên Firebase
          if (userWithAvatar.avatar) {
            FirebaseService.saveData({
              userAvatars: { [registeredUser.id]: userWithAvatar.avatar }
            });
          }
          }
          
          toast({
            title: "Đăng nhập thành công",
            description: `Xin chào ${registeredUser.displayName}!`,
          });
          return true;
        } else {
          console.warn('Password mismatch for user:', registeredUser.id);
          toast({
            title: "Đăng nhập thất bại",
            description: "Mật khẩu không đúng. Vui lòng thử lại.",
            variant: "destructive"
          });
          return false;
        }
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
      
      // Xóa trạng thái đăng nhập khỏi localStorage
      try {
        localStorage.removeItem('authState');
      } catch (localStorageError) {
        console.error('Error removing auth state from localStorage:', localStorageError);
      }
      
      toast({
        title: "Đăng xuất thành công",
        description: "Bạn đã đăng xuất khỏi hệ thống",
      });
      
      // Chuyển hướng về trang chủ sau khi đăng xuất
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (user: User) => {
    if (!authState.user) return;
    
    try {
      // Try to update with Supabase
      const updateData = {
        username: user.username,
        display_name: user.displayName,
        birthdate: user.birthdate as string, // Đảm bảo birthdate là string
      };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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
      
      // Xóa người dùng khỏi registeredMockUsers nếu có
      if (window.registeredMockUsers) {
        // Lọc ra người dùng cần xóa
        window.registeredMockUsers = window.registeredMockUsers.filter(user => user.id !== userId);
        
        // Lưu lại vào localStorage
        try {
          localStorage.setItem('registeredMockUsers', JSON.stringify(window.registeredMockUsers));
          console.log('Xóa người dùng khỏi localStorage thành công');
        } catch (localStorageError) {
          console.error('Lỗi khi lưu registeredMockUsers vào localStorage:', localStorageError);
        }
      }
      
      toast({
        title: "Xóa thành công",
        description: "Người dùng đã được xóa khỏi hệ thống",
      });
    } catch (error) {
      console.error('Delete user error:', error);
      
      // Mock delete for development
      // Xóa người dùng khỏi registeredMockUsers nếu có
      if (window.registeredMockUsers) {
        // Lọc ra người dùng cần xóa
        window.registeredMockUsers = window.registeredMockUsers.filter(user => user.id !== userId);
        
        // Lưu lại vào localStorage
        try {
          localStorage.setItem('registeredMockUsers', JSON.stringify(window.registeredMockUsers));
          console.log('Xóa người dùng khỏi localStorage thành công');
        } catch (localStorageError) {
          console.error('Lỗi khi lưu registeredMockUsers vào localStorage:', localStorageError);
        }
      }
      
      toast({
        title: "Development Mode",
        description: "User deletion simulated",
      });
    }
  };

  const updateAvatar = async (userId: string, avatarUrl: string) => {
    try {
      // Thử cập nhật với Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: avatarUrl })
        .eq('id', userId);

      if (error) throw error;
      
      // Cập nhật state nếu người dùng hiện tại đang thay đổi avatar
      if (authState.user && authState.user.id === userId) {
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, avatar: avatarUrl } : null
        }));
      }
      
      // Cập nhật registeredMockUsers nếu đang ở chế độ development
      if (window.registeredMockUsers) {
        window.registeredMockUsers = window.registeredMockUsers.map(user => 
          user.id === userId ? { ...user, avatar: avatarUrl } : user
        );
      }
      
    } catch (error) {
      console.error('Update avatar error:', error);
      
      // Mock update cho môi trường development
      if (authState.user && authState.user.id === userId) {
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, avatar: avatarUrl } : null
        }));
      }
      
      // Cập nhật registeredMockUsers trong chế độ development
      if (window.registeredMockUsers) {
        window.registeredMockUsers = window.registeredMockUsers.map(user => 
          user.id === userId ? { ...user, avatar: avatarUrl } : user
        );
      }
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
        updateAvatar,
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
