import { User } from '@/types';
import { Post } from '@/types/post';
import { Event } from '@/types';

// Định nghĩa cấu trúc dữ liệu đồng bộ
export interface CloudData {
  users: User[];
  passwords: Record<string, string>;
  events: Event[];
  posts: Post[];
  userAvatars: Record<string, string>; // Lưu trữ ảnh đại diện: { userId: avatarUrl }
  lastUpdated: string;
}

/**
 * Service đồng bộ dữ liệu giữa các thiết bị
 * Sử dụng localStorage làm "đám mây ảo" để đồng bộ
 */
export const SyncService = {
  // Lưu dữ liệu vào "đám mây ảo"
  saveToCloud: (data: Partial<CloudData>): void => {
    try {
      // Lấy dữ liệu hiện tại
      const existingData = localStorage.getItem('friendverse_cloud_data');
      let cloudData: CloudData;
      
      if (existingData) {
        cloudData = JSON.parse(existingData);
        // Cập nhật các trường đã cung cấp
        cloudData = { ...cloudData, ...data, lastUpdated: new Date().toISOString() };
      } else {
        // Tạo dữ liệu mới với các giá trị mặc định
        cloudData = {
          users: data.users || [],
          passwords: data.passwords || {},
          events: data.events || [],
          posts: data.posts || [],
          userAvatars: data.userAvatars || {},
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Lưu dữ liệu vào localStorage
      localStorage.setItem('friendverse_cloud_data', JSON.stringify(cloudData));
      console.log('Data synced to cloud:', new Date().toISOString());
    } catch (error) {
      console.error('Error saving data to cloud:', error);
    }
  },
  
  // Lấy dữ liệu từ "đám mây ảo"
  loadFromCloud: (): CloudData | null => {
    try {
      const cloudData = localStorage.getItem('friendverse_cloud_data');
      if (!cloudData) return null;
      
      return JSON.parse(cloudData);
    } catch (error) {
      console.error('Error loading data from cloud:', error);
      return null;
    }
  },
  
  // Lưu ảnh đại diện người dùng
  saveUserAvatar: (userId: string, avatarUrl: string): void => {
    try {
      const cloudData = SyncService.loadFromCloud();
      if (!cloudData) {
        // Tạo mới dữ liệu cloud nếu chưa có
        SyncService.saveToCloud({
          userAvatars: { [userId]: avatarUrl }
        });
        return;
      }
      
      // Cập nhật hoặc thêm ảnh đại diện mới
      const userAvatars = cloudData.userAvatars || {};
      userAvatars[userId] = avatarUrl;
      
      // Cập nhật lên cloud
      SyncService.saveToCloud({ userAvatars });
      
      console.log(`Avatar saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving user avatar:', error);
    }
  },
  
  // Lấy ảnh đại diện người dùng
  getUserAvatar: (userId: string): string | null => {
    try {
      const cloudData = SyncService.loadFromCloud();
      if (!cloudData || !cloudData.userAvatars) return null;
      
      return cloudData.userAvatars[userId] || null;
    } catch (error) {
      console.error('Error getting user avatar:', error);
      return null;
    }
  },
  
  // Đồng bộ một loại dữ liệu cụ thể
  syncData: <T>(
    dataType: keyof CloudData, 
    localData: T, 
    shouldReplace: boolean = false
  ): T => {
    try {
      const cloudData = SyncService.loadFromCloud();
      if (!cloudData) return localData;
      
      // Lấy dữ liệu từ cloud
      const cloudTypeData = cloudData[dataType] as unknown as T;
      
      if (!cloudTypeData) return localData;
      
      // Nếu yêu cầu thay thế hoàn toàn, trả về dữ liệu từ cloud
      if (shouldReplace) {
        return cloudTypeData;
      }
      
      // Hợp nhất dữ liệu (đơn giản - ghi đè)
      // Trong ứng dụng thực tế, bạn sẽ cần logic phức tạp hơn để hợp nhất
      return cloudTypeData;
    } catch (error) {
      console.error(`Error syncing ${dataType}:`, error);
      return localData;
    }
  },
  
  // Khởi tạo dữ liệu từ cloud khi ứng dụng khởi động
  initFromCloud: (): void => {
    try {
      const cloudData = SyncService.loadFromCloud();
      if (!cloudData) return;
      
      // Khôi phục danh sách người dùng
      if (cloudData.users && cloudData.users.length > 0) {
        // Kết hợp thông tin ảnh đại diện từ userAvatars cho người dùng
        if (cloudData.userAvatars) {
          cloudData.users.forEach(user => {
            const savedAvatar = cloudData.userAvatars[user.id];
            if (savedAvatar) {
              user.avatar = savedAvatar;
            }
          });
        }
        
        window.registeredMockUsers = cloudData.users;
        localStorage.setItem('registeredMockUsers', JSON.stringify(cloudData.users));
      }
      
      // Khôi phục mật khẩu
      if (cloudData.passwords) {
        window.registeredUserPasswords = cloudData.passwords;
        localStorage.setItem('registeredUserPasswords', JSON.stringify(cloudData.passwords));
      }
      
      // Khôi phục sự kiện
      if (cloudData.events && cloudData.events.length > 0) {
        localStorage.setItem('events', JSON.stringify(cloudData.events));
      }
      
      // Khôi phục bài đăng
      if (cloudData.posts && cloudData.posts.length > 0) {
        localStorage.setItem('posts', JSON.stringify(cloudData.posts));
      }
      
      // Lưu ảnh đại diện vào localStorage riêng biệt
      if (cloudData.userAvatars) {
        localStorage.setItem('userAvatars', JSON.stringify(cloudData.userAvatars));
      }
      
      console.log('Data initialized from cloud:', cloudData.lastUpdated);
    } catch (error) {
      console.error('Error initializing data from cloud:', error);
    }
  }
};

// Khởi tạo dữ liệu khi module được import
SyncService.initFromCloud();
