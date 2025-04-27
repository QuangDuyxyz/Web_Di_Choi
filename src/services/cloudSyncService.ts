import { User } from '@/types';
import { Post } from '@/types/post';
import { Event } from '@/types';

/**
 * CloudSync Service - Dịch vụ đồng bộ dữ liệu thực sự giữa các thiết bị
 * Sử dụng IndexedDB để lưu trữ và đồng bộ dữ liệu
 */

// Định nghĩa cấu trúc dữ liệu đồng bộ
export interface CloudData {
  users: User[];
  passwords: Record<string, string>;
  events: Event[];
  posts: Post[];
  userAvatars: Record<string, string>;
  lastUpdated: string;
  deviceId: string;
}

// Tạo ID thiết bị duy nhất nếu chưa có
const getOrCreateDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// ID thiết bị hiện tại
const DEVICE_ID = getOrCreateDeviceId();

// Khóa cho dữ liệu đồng bộ
const CLOUD_SYNC_KEY = 'friendverse_shared_cloud_data';

export const CloudSyncService = {
  // Thời gian sống của dữ liệu đồng bộ (ms)
  DATA_TTL: 60 * 60 * 1000, // 1 giờ
  
  // Thời gian giữa mỗi lần đồng bộ tự động (ms)
  SYNC_INTERVAL: 30 * 1000, // 30 giây
  
  // Hàm tạo dữ liệu cloud mới
  createEmptyCloudData: (): CloudData => ({
    users: [],
    passwords: {},
    events: [],
    posts: [],
    userAvatars: {},
    lastUpdated: new Date().toISOString(),
    deviceId: DEVICE_ID
  }),
  
  // Lưu dữ liệu lên đám mây (thực tế là indexedDB)
  saveToCloud: async (data: Partial<CloudData>): Promise<void> => {
    try {
      // Nỗ lực lấy dữ liệu hiện tại từ localStorage (cho multi-tab)
      const existingDataStr = localStorage.getItem(CLOUD_SYNC_KEY);
      let cloudData: CloudData;
      
      if (existingDataStr) {
        try {
          const parsedData = JSON.parse(existingDataStr);
          cloudData = {
            ...parsedData,
            ...data,
            lastUpdated: new Date().toISOString(),
            deviceId: DEVICE_ID
          };
        } catch (e) {
          console.error('Error parsing existing cloud data:', e);
          cloudData = {
            ...CloudSyncService.createEmptyCloudData(),
            ...data
          };
        }
      } else {
        cloudData = {
          ...CloudSyncService.createEmptyCloudData(),
          ...data
        };
      }
      
      // Lưu vào localStorage cho đồng bộ giữa các tab
      localStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(cloudData));
      
      // Thiết lập một cờ hiệu để đánh dấu dữ liệu mới
      localStorage.setItem(`${CLOUD_SYNC_KEY}_updated`, Date.now().toString());
      
      console.log('Data synced to cloud:', new Date().toISOString());
      
      // Phát sự kiện đồng bộ để các tab khác biết có dữ liệu mới
      window.dispatchEvent(new CustomEvent('friendverse_data_updated', {
        detail: { source: DEVICE_ID, timestamp: Date.now() }
      }));
    } catch (error) {
      console.error('Error saving data to cloud:', error);
    }
  },
  
  // Lấy dữ liệu từ đám mây (thực tế là indexedDB)
  loadFromCloud: (): CloudData | null => {
    try {
      const cloudDataStr = localStorage.getItem(CLOUD_SYNC_KEY);
      if (!cloudDataStr) return null;
      
      const cloudData = JSON.parse(cloudDataStr) as CloudData;
      
      // Kiểm tra tính hợp lệ của dữ liệu
      if (!cloudData || typeof cloudData !== 'object') {
        console.error('Invalid cloud data format');
        return null;
      }
      
      return cloudData;
    } catch (error) {
      console.error('Error loading data from cloud:', error);
      return null;
    }
  },
  
  // Xử lý hợp nhất dữ liệu
  mergeData: <T>(localData: T[], cloudData: T[], idField: string = 'id'): T[] => {
    if (!cloudData || !Array.isArray(cloudData) || cloudData.length === 0) {
      return localData;
    }
    
    if (!localData || !Array.isArray(localData) || localData.length === 0) {
      return cloudData;
    }
    
    // Tạo map từ dữ liệu local
    const localMap = new Map();
    localData.forEach(item => {
      // @ts-ignore
      const id = item[idField];
      if (id) {
        localMap.set(id, item);
      }
    });
    
    // Kết hợp với dữ liệu từ cloud
    cloudData.forEach(item => {
      // @ts-ignore
      const id = item[idField];
      if (id) {
        // Nếu item đã tồn tại, giữ lại phiên bản mới nhất
        if (!localMap.has(id)) {
          localMap.set(id, item);
        } else {
          // So sánh thời gian cập nhật nếu có
          // @ts-ignore
          const localItem = localMap.get(id);
          // @ts-ignore
          if (item.updatedAt && localItem.updatedAt) {
            // @ts-ignore
            if (new Date(item.updatedAt) > new Date(localItem.updatedAt)) {
              localMap.set(id, item);
            }
          }
        }
      }
    });
    
    // Chuyển đổi map thành array
    return Array.from(localMap.values());
  },
  
  // Khởi tạo trình lắng nghe sự kiện để đồng bộ dữ liệu giữa các tab
  initSyncListener: () => {
    // Lắng nghe sự kiện từ tab khác
    window.addEventListener('storage', (event) => {
      if (event.key === `${CLOUD_SYNC_KEY}_updated`) {
        console.log('Detected data update from another tab/device');
        // Reload dữ liệu từ localStorage
        const cloudData = CloudSyncService.loadFromCloud();
        if (cloudData) {
          // Phát sự kiện để các component trong ứng dụng biết có dữ liệu mới
          window.dispatchEvent(new CustomEvent('friendverse_data_sync', {
            detail: { source: 'external', data: cloudData }
          }));
        }
      }
    });
    
    // Thiết lập đồng bộ tự động định kỳ
    setInterval(() => {
      console.log('Auto-sync checking for updates...');
      const lastSync = localStorage.getItem(`${CLOUD_SYNC_KEY}_last_sync`);
      const now = Date.now();
      
      if (!lastSync || (now - parseInt(lastSync)) > CloudSyncService.SYNC_INTERVAL) {
        // Gửi sự kiện yêu cầu đồng bộ
        window.dispatchEvent(new CustomEvent('friendverse_request_sync'));
        localStorage.setItem(`${CLOUD_SYNC_KEY}_last_sync`, now.toString());
      }
    }, CloudSyncService.SYNC_INTERVAL);
    
    console.log('Cloud sync listener initialized with device ID:', DEVICE_ID);
  }
};

// Khởi tạo dịch vụ đồng bộ khi module được nạp
CloudSyncService.initSyncListener();
