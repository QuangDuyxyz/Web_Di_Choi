
import { EventType, Event, User } from '../types';

// Mock user data
export const mockUsers: User[] = [
  {
    id: 'admin-fixed-id',
    username: 'admin123',
    email: 'admin123@gmail.com',
    displayName: 'Admin System',
    birthdate: '1990-01-01',
    avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=admin',
    role: 'admin',
  },
  {
    id: '1',
    username: 'admin',
    email: 'admin@friendverse.com',
    displayName: 'Admin',
    birthdate: '1990-01-01',
    avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=admin',
    role: 'admin',
  },
  {
    id: '2',
    username: 'minh',
    email: 'minh@friendverse.com',
    displayName: 'Minh',
    birthdate: '1995-05-15',
    avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=minh',
    role: 'user',
  },
  {
    id: '3',
    username: 'linh',
    email: 'linh@friendverse.com',
    displayName: 'Linh',
    birthdate: '1997-08-22',
    avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=linh',
    role: 'user',
  },
  {
    id: '4',
    username: 'duc',
    email: 'duc@friendverse.com',
    displayName: 'Đức',
    birthdate: '1994-11-10',
    avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=duc',
    role: 'user',
  },
  {
    id: '5',
    username: 'hien',
    email: 'hien@friendverse.com',
    displayName: 'Hiền',
    birthdate: '1996-03-28',
    avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=hien',
    role: 'user',
  },
];

// Function to create events
const createEvents = () => {
  const today = new Date();
  const events: Event[] = [];

  // Calculate some dates relative to today
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Create birthday events for all users
  mockUsers.forEach(user => {
    const birthDate = new Date(user.birthdate);
    const birthYearDate = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    
    // If birthday has passed this year, set for next year
    if (birthYearDate < today) {
      birthYearDate.setFullYear(birthYearDate.getFullYear() + 1);
    }

    events.push({
      id: `birthday-${user.id}`,
      title: `${user.displayName}'s Birthday`,
      date: birthYearDate.toISOString(),
      description: `Celebrate ${user.displayName}'s special day!`,
      eventType: 'birthday',
      createdBy: '1', // Admin created
      emoji: '🎂'
    });
  });

  // Add some group events
  events.push({
    id: 'event1',
    title: 'Weekend Trip to Da Lat',
    date: nextMonth.toISOString(),
    description: 'A relaxing weekend trip to Da Lat with lots of good food and sightseeing!',
    eventType: 'trip',
    createdBy: '1',
    emoji: '🏞️'
  });

  events.push({
    id: 'event2',
    title: 'Group Dinner',
    date: nextWeek.toISOString(),
    description: 'Monthly dinner gathering at our favorite restaurant',
    eventType: 'meeting',
    createdBy: '2',
    emoji: '🍜'
  });

  events.push({
    id: 'event3',
    title: 'Group Anniversary',
    date: new Date(today.getFullYear(), 11, 25).toISOString(), // Dec 25th
    description: '5 years since our group was formed!',
    eventType: 'anniversary',
    createdBy: '1',
    emoji: '🎉'
  });

  events.push({
    id: 'event4',
    title: 'Movie Night',
    date: tomorrow.toISOString(),
    description: 'Watch the new Marvel movie at CGV cinema!',
    eventType: 'meeting',
    createdBy: '3',
    emoji: '🎬'
  });

  return events;
};

export const mockEvents: Event[] = createEvents();
