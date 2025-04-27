
import { EventType, Event, User } from '../types';

// Chỉ giữ lại tài khoản admin
export const mockUsers: User[] = [
  {
    id: 'admin-fixed-id',
    username: 'admin123',
    email: 'admin123@gmail.com',
    displayName: 'Admin System',
    birthdate: '1990-01-01',
    avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=admin',
    role: 'admin',
  }
];

// Hàm tạo sự kiện rỗng - không có sự kiện mẫu nào
const createEvents = () => {
  return [] as Event[];
};

// Mảng sự kiện rỗng
export const mockEvents: Event[] = [];
