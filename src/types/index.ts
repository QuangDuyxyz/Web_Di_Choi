export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  birthdate: string | Date;
  avatar: string;
  role: UserRole;
  created_at?: string;
}

export type EventType = 'birthday' | 'anniversary' | 'trip' | 'meeting' | 'other';

export interface Event {
  id: string;
  title: string;
  date: Date | string;
  description: string;
  eventType: EventType;
  createdBy: string; // User ID
  emoji?: string;
  image?: string;
  wishes?: Wish[];
  likes?: string[]; // Array of User IDs who liked the event
}

export interface Wish {
  id: string;
  content: string;
  userId: string; // User ID
  createdAt: Date | string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  birthdate: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  createdBy: string; // User ID
  createdAt: Date | string;
  members: string[]; // Array of User IDs
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string; // User ID
  content: string;
  timestamp: Date | string;
  readBy: string[]; // Array of User IDs who have read the message
}
