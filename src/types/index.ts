export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  birthdate: Date | string;
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
