import { User } from '@/types';
import { Post } from '@/types/post';
import { Event } from '@/types';

// Interface cho dữ liệu đồng bộ
export interface SyncData {
  users: User[];
  passwords: Record<string, string>;
  events: Event[];
  posts: Post[];
  userAvatars: Record<string, string>;
  lastUpdated: string;
  deviceId: string;
}

// API Key cho JSONBin (miễn phí)
const API_KEY = '$2a$10$Z3n/8j5.OIIEXJ60VpKnU.GTN5d1L7qGfnRcpubCYUhD1LbvTYcKO';

// Tạo ID thiết bị
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// ID bin để lưu trữ dữ liệu (được tạo động khi khởi tạo)
let JSONBIN_ID = localStorage.getItem('friendverse_jsonbin_id') || '';
const DEVICE_ID = getDeviceId();

export const JsonBinService = {
  // Khởi tạo bin nếu chưa có
  initializeBin: async (): Promise<string> => {
    // Kiểm tra nếu đã có bin ID trong localStorage
    if (JSONBIN_ID) {
      console.log('Using existing JSONBin ID:', JSONBIN_ID);
      return JSONBIN_ID;
    }

    try {
      // Tạo bin mới
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY,
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify({
          users: [],
          passwords: {},
          events: [],
          posts: [],
          userAvatars: {},
          lastUpdated: new Date().toISOString(),
          deviceId: DEVICE_ID
        })
      });

      const data = await response.json();
      
      if (data.metadata && data.metadata.id) {
        JSONBIN_ID = data.metadata.id;
        localStorage.setItem('friendverse_jsonbin_id', JSONBIN_ID);
        console.log('Created new JSONBin with ID:', JSONBIN_ID);
        return JSONBIN_ID;
      } else {
        console.error('Failed to create JSONBin:', data);
        throw new Error('Failed to create JSONBin');
      }
    } catch (error) {
      console.error('Error initializing JSONBin:', error);
      throw error;
    }
  },

  // Lấy ID bin hiện tại hoặc tạo mới nếu chưa có
  getBinId: async (): Promise<string> => {
    if (!JSONBIN_ID) {
      return await JsonBinService.initializeBin();
    }
    return JSONBIN_ID;
  },

  // Thiết lập bin ID
  setBinId: (binId: string): void => {
    JSONBIN_ID = binId;
    localStorage.setItem('friendverse_jsonbin_id', binId);
  },

  // Lưu dữ liệu lên JSONBin
  saveData: async (data: Partial<SyncData>): Promise<void> => {
    try {
      // Lấy bin ID
      const binId = await JsonBinService.getBinId();

      // Lấy dữ liệu hiện tại
      const currentData = await JsonBinService.getData() || {
        users: [],
        passwords: {},
        events: [],
        posts: [],
        userAvatars: {},
        lastUpdated: new Date().toISOString(),
        deviceId: DEVICE_ID
      };

      // Cập nhật dữ liệu mới
      const updateData = {
        ...currentData,
        ...data,
        lastUpdated: new Date().toISOString(),
        deviceId: DEVICE_ID
      };

      // Gửi lên JSONBin
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify(updateData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Error saving data to JSONBin:', responseData);
        throw new Error('Failed to save data to JSONBin');
      }

      console.log('Data saved to JSONBin:', new Date().toISOString());
      
      // Phát sự kiện đồng bộ thành công để thông báo cho các thành phần trong ứng dụng
      window.dispatchEvent(new CustomEvent('friendverse_data_updated', {
        detail: {
          source: 'local',
          timestamp: Date.now()
        }
      }));
    } catch (error) {
      console.error('Error saving data to JSONBin:', error);
      throw error;
    }
  },

  // Lấy dữ liệu từ JSONBin
  getData: async (): Promise<SyncData | null> => {
    try {
      // Lấy bin ID
      const binId = await JsonBinService.getBinId();

      // Lấy dữ liệu từ JSONBin
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': API_KEY
        }
      });

      if (!response.ok) {
        console.error('Error getting data from JSONBin:', response.statusText);
        return null;
      }

      const responseData = await response.json();
      
      if (responseData.record) {
        return responseData.record as SyncData;
      } else {
        console.log('No data available in JSONBin');
        return null;
      }
    } catch (error) {
      console.error('Error getting data from JSONBin:', error);
      return null;
    }
  },

  // Khởi tạo đồng bộ có thời gian
  startSync: (interval: number = 30000): () => void => {
    // Thực hiện đồng bộ ban đầu
    JsonBinService.checkForUpdates();

    // Thiết lập đồng bộ định kỳ
    const intervalId = setInterval(() => {
      JsonBinService.checkForUpdates();
    }, interval);

    // Trả về hàm để dừng đồng bộ
    return () => {
      clearInterval(intervalId);
    };
  },

  // Kiểm tra xem có cập nhật mới không
  checkForUpdates: async (): Promise<void> => {
    try {
      // Lấy dữ liệu từ JSONBin
      const data = await JsonBinService.getData();
      
      if (data) {
        // Kiểm tra xem dữ liệu có từ thiết bị khác không
        if (data.deviceId && data.deviceId !== DEVICE_ID) {
          // Phát sự kiện có dữ liệu mới
          window.dispatchEvent(new CustomEvent('friendverse_data_sync', {
            detail: {
              source: 'remote',
              data: data
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
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
  },

  // Chia sẻ ID bin cho người dùng
  getShareableLink: async (): Promise<string> => {
    const binId = await JsonBinService.getBinId();
    return `https://friendverse-sync.web.app/sync?binId=${binId}`;
  },

  // Sử dụng ID bin được chia sẻ
  useSharedBin: async (binId: string): Promise<boolean> => {
    try {
      // Kiểm tra xem bin ID có hợp lệ không
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': API_KEY
        }
      });

      if (!response.ok) {
        console.error('Invalid Bin ID:', binId);
        return false;
      }

      // Lưu bin ID
      JsonBinService.setBinId(binId);
      
      // Thông báo đồng bộ thành công
      window.dispatchEvent(new CustomEvent('friendverse_bin_connected', {
        detail: {
          binId: binId
        }
      }));

      return true;
    } catch (error) {
      console.error('Error using shared bin:', error);
      return false;
    }
  }
};

// Khởi tạo bin khi module được load
JsonBinService.getBinId().catch(error => {
  console.error('Error during initialization of JSONBin service:', error);
});
