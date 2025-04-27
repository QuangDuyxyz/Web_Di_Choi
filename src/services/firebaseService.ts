// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, child, update } from "firebase/database";
import { User } from '@/types';
import { Post } from '@/types/post';
import { Event } from '@/types';

// Cấu hình Firebase - sử dụng database miễn phí cho mục đích thử nghiệm
// Trong môi trường thực tế, nên sử dụng biến môi trường để lưu các khóa này
const firebaseConfig = {
  apiKey: "AIzaSyC1o8U2mZk0zKPzUkzXXMgcv6tqOhQd4Og",
  authDomain: "friendverse-sync.firebaseapp.com",
  databaseURL: "https://friendverse-sync-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "friendverse-sync",
  storageBucket: "friendverse-sync.appspot.com",
  messagingSenderId: "506345974759",
  appId: "1:506345974759:web:bc9e7f14aafd4521f3b0b5"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Định nghĩa cấu trúc dữ liệu đồng bộ
export interface SyncData {
  users: User[];
  passwords: Record<string, string>;
  events: Event[];
  posts: Post[];
  userAvatars: Record<string, string>;
  lastUpdated: string;
}

// Tạo ID thiết bị
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

const DEVICE_ID = getDeviceId();

export const FirebaseService = {
  // Lưu toàn bộ dữ liệu lên Firebase
  saveData: async (data: Partial<SyncData>): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();
      const updates: Record<string, any> = {};
      
      // Tạo cập nhật cho từng loại dữ liệu
      if (data.users) {
        updates['/users'] = data.users;
      }
      
      if (data.passwords) {
        updates['/passwords'] = data.passwords;
      }
      
      if (data.events) {
        updates['/events'] = data.events;
      }
      
      if (data.posts) {
        updates['/posts'] = data.posts;
      }
      
      if (data.userAvatars) {
        updates['/userAvatars'] = data.userAvatars;
      }
      
      updates['/lastUpdated'] = timestamp;
      updates['/lastDevice'] = DEVICE_ID;
      
      // Cập nhật Firebase
      await update(ref(database), updates);
      
      console.log('Data saved to Firebase:', timestamp);
      
      // Phát sự kiện cục bộ để thông báo cho các thành phần trong ứng dụng
      window.dispatchEvent(new CustomEvent('friendverse_data_updated', {
        detail: { 
          source: 'local', 
          timestamp: Date.now()
        }
      }));
    } catch (error) {
      console.error('Error saving data to Firebase:', error);
    }
  },
  
  // Lấy toàn bộ dữ liệu từ Firebase
  getData: async (): Promise<SyncData | null> => {
    try {
      const snapshot = await get(ref(database));
      if (snapshot.exists()) {
        return snapshot.val() as SyncData;
      } else {
        console.log("No data available in Firebase");
        return null;
      }
    } catch (error) {
      console.error("Error getting data from Firebase:", error);
      return null;
    }
  },
  
  // Lắng nghe thay đổi dữ liệu từ Firebase
  subscribe: (
    callback: (data: SyncData) => void
  ): (() => void) => {
    const dataRef = ref(database);
    
    // Thiết lập lắng nghe thay đổi
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as SyncData;
        // Kiểm tra xem dữ liệu có đến từ thiết bị khác không
        if (data.lastDevice && data.lastDevice !== DEVICE_ID) {
          // Chỉ xử lý nếu dữ liệu từ thiết bị khác
          callback(data);
        }
      }
    });
    
    // Trả về hàm để hủy lắng nghe
    return unsubscribe;
  },
  
  // Lưu một phần dữ liệu cụ thể
  savePartialData: async <T>(path: string, data: T): Promise<void> => {
    try {
      await set(ref(database, path), data);
      console.log(`Data saved to Firebase path ${path}`);
    } catch (error) {
      console.error(`Error saving data to Firebase path ${path}:`, error);
    }
  },
  
  // Kết hợp các mảng dữ liệu
  mergeArrays: <T extends { id: string }>(local: T[], remote: T[]): T[] => {
    if (!remote || remote.length === 0) return local;
    if (!local || local.length === 0) return remote;
    
    // Tạo Map từ dữ liệu local và remote để kết hợp
    const combinedMap = new Map<string, T>();
    
    // Thêm dữ liệu local vào map
    local.forEach(item => {
      if (item && item.id) {
        combinedMap.set(item.id, item);
      }
    });
    
    // Thêm hoặc ghi đè dữ liệu remote
    remote.forEach(item => {
      if (item && item.id) {
        combinedMap.set(item.id, item);
      }
    });
    
    // Chuyển đổi Map thành Array
    return Array.from(combinedMap.values());
  }
};

// Khởi tạo dữ liệu ban đầu nếu chưa có
FirebaseService.getData().then(data => {
  if (!data) {
    // Database trống, khởi tạo với dữ liệu mặc định
    FirebaseService.saveData({
      users: window.registeredMockUsers || [],
      passwords: window.registeredUserPasswords || {},
      events: [],
      posts: [],
      userAvatars: {},
      lastUpdated: new Date().toISOString()
    });
  }
});
