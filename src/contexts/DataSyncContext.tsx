import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { JsonBinService, SyncData } from '@/services/jsonBinService';
import { useAuth } from './AuthContext';
import { usePost } from './PostContext';
import { useToast } from '@/components/ui/use-toast';
import { PostWithComments, Post } from '@/types/post';
import { User } from '@/types';

interface DataSyncContextProps {
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncNow: () => Promise<void>;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

const DataSyncContext = createContext<DataSyncContextProps>({
  isSyncing: false,
  lastSyncTime: null,
  syncNow: async () => {},
  syncStatus: 'idle',
});

export const useDataSync = () => useContext(DataSyncContext);

export const DataSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const { toast } = useToast();
  const auth = useAuth();
  const { posts, toggleLike, addComment, deletePost } = usePost();
  
  // State để lưu trữ và cập nhật dữ liệu cục bộ
  const [localData, setLocalData] = useState<{
    users: User[];
    passwords: Record<string, string>;
    posts: PostWithComments[];
    userAvatars: Record<string, string>;
  }>({ 
    users: [], 
    passwords: {}, 
    posts: [], 
    userAvatars: {} 
  });

  // Đồng bộ hóa dữ liệu
  const syncNow = async (): Promise<void> => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      setSyncStatus('syncing');
      
      // Đầu tiên lưu dữ liệu hiện tại
      await saveCurrentData();
      
      // Sau đó lấy dữ liệu từ JsonBin
      const remoteData = await JsonBinService.getData();
      
      if (remoteData) {
        await applyRemoteData(remoteData);
        setLastSyncTime(new Date().toLocaleTimeString());
        setSyncStatus('success');
        
        toast({
          title: "Đồng bộ thành công",
          description: "Dữ liệu của bạn đã được đồng bộ thành công.",
        });
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      setSyncStatus('error');
      
      toast({
        title: "Lỗi đồng bộ",
        description: "Có lỗi xảy ra khi đồng bộ dữ liệu.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Lưu dữ liệu hiện tại lên JsonBin
  const saveCurrentData = async (): Promise<void> => {
    try {
      // Lấy dữ liệu từ localStorage
      const savedUsers = localStorage.getItem('registeredMockUsers');
      const registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
      
      const savedPasswords = localStorage.getItem('registeredUserPasswords');
      const passwords = savedPasswords ? JSON.parse(savedPasswords) : {};
      
      const savedAvatars = localStorage.getItem('userAvatars');
      const avatars = savedAvatars ? JSON.parse(savedAvatars) : {};
      
      await JsonBinService.saveData({
        users: registeredUsers,
        passwords: passwords,
        posts: posts,
        userAvatars: avatars
      });
      
      // Cập nhật dữ liệu cục bộ
      setLocalData({
        users: registeredUsers,
        passwords: passwords,
        posts: posts,
        userAvatars: avatars
      });
    } catch (error) {
      console.error('Error saving current data:', error);
      throw error;
    }
  };
  
  // Áp dụng dữ liệu từ xa
  const applyRemoteData = async (remoteData: SyncData): Promise<void> => {
    try {
      // Lấy dữ liệu từ localStorage
      const savedUsers = localStorage.getItem('registeredMockUsers');
      const registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
      
      const savedPasswords = localStorage.getItem('registeredUserPasswords');
      const passwords = savedPasswords ? JSON.parse(savedPasswords) : {};
      
      const savedAvatars = localStorage.getItem('userAvatars');
      const avatars = savedAvatars ? JSON.parse(savedAvatars) : {};
      
      // Cập nhật người dùng đã đăng ký
      if (remoteData.users) {
        const combinedUsers = JsonBinService.mergeArrays(
          registeredUsers,
          remoteData.users
        );
        
        // Lưu vào localStorage
        localStorage.setItem('registeredMockUsers', JSON.stringify(combinedUsers));
        
        // Cập nhật state cục bộ
        setLocalData(prev => ({ ...prev, users: combinedUsers }));
      }
      
      // Cập nhật mật khẩu
      if (remoteData.passwords) {
        const combinedPasswords = { ...passwords, ...remoteData.passwords };
        
        // Lưu mật khẩu vào localStorage
        localStorage.setItem('registeredUserPasswords', JSON.stringify(combinedPasswords));
        
        // Cập nhật state cục bộ
        setLocalData(prev => ({ ...prev, passwords: combinedPasswords }));
      }
      
      // Cập nhật ảnh đại diện
      if (remoteData.userAvatars) {
        const combinedAvatars = { ...avatars, ...remoteData.userAvatars };
        
        // Lưu avatars vào localStorage
        localStorage.setItem('userAvatars', JSON.stringify(combinedAvatars));
        
        // Cập nhật state cục bộ
        setLocalData(prev => ({ ...prev, userAvatars: combinedAvatars }));
      }
      
      // Cập nhật bài đăng
      if (remoteData.posts && Array.isArray(remoteData.posts)) {
        // Đảm bảo mỗi post có thuộc tính comments
        const postsWithComments = remoteData.posts.map(post => {
          if (!('comments' in post)) {
            return { ...post, comments: [] } as PostWithComments;
          }
          return post as PostWithComments;
        });
        
        const combinedPosts = JsonBinService.mergeArrays(
          posts as PostWithComments[], 
          postsWithComments
        );
        
        // Lưu posts vào localStorage để đồng bộ
        localStorage.setItem('posts', JSON.stringify(combinedPosts));
        
        // Cập nhật state cục bộ
        setLocalData(prev => ({ ...prev, posts: combinedPosts }));
      }
    } catch (error) {
      console.error('Error applying remote data:', error);
      throw error;
    }
  };
  
  // Xử lý sự kiện đồng bộ dữ liệu từ JsonBin
  useEffect(() => {
    const handleDataSync = async (event: CustomEvent) => {
      if (event.detail?.source === 'remote' && event.detail?.data) {
        try {
          await applyRemoteData(event.detail.data);
          setLastSyncTime(new Date().toLocaleTimeString());
          
          toast({
            title: "Đồng bộ tự động",
            description: "Dữ liệu mới từ thiết bị khác đã được đồng bộ.",
          });
        } catch (error) {
          console.error('Error handling data sync event:', error);
        }
      }
    };
    
    window.addEventListener('friendverse_data_sync', handleDataSync as EventListener);
    
    return () => {
      window.removeEventListener('friendverse_data_sync', handleDataSync as EventListener);
    };
  }, [toast, auth, posts]);
  
  // Khởi tạo đồng bộ tự động khi component được tải
  useEffect(() => {
    // Bắt đầu đồng bộ tự động
    const stopSync = JsonBinService.startSync(60000); // 1 phút
    
    return () => {
      stopSync(); // Dừng đồng bộ khi component unmount
    };
  }, []);
  
  // Đồng bộ khi đăng nhập hoặc đăng xuất
  useEffect(() => {
    if (auth.isAuthenticated) {
      // Đồng bộ khi đăng nhập
      syncNow();
    }
    // Không cần đồng bộ khi đăng xuất vì đã không còn dữ liệu để đồng bộ
  }, [auth.isAuthenticated]);

  return (
    <DataSyncContext.Provider
      value={{
        isSyncing,
        lastSyncTime,
        syncNow,
        syncStatus,
      }}
    >
      {children}
    </DataSyncContext.Provider>
  );
};

export default DataSyncProvider;
