
import { Event, User, EventType } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    displayName: 'Admin User',
    birthdate: new Date('1995-05-15').toISOString(),
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=John',
    role: 'admin'
  },
  {
    id: '2',
    username: 'minh',
    displayName: 'Minh Nguyen',
    birthdate: new Date('1997-08-23').toISOString(),
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=Minh',
    role: 'user'
  },
  {
    id: '3',
    username: 'linh',
    displayName: 'Linh Tran',
    birthdate: new Date('1996-04-30').toISOString(),
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=Linh',
    role: 'user'
  },
  {
    id: '4',
    username: 'quan',
    displayName: 'Quan Le',
    birthdate: new Date('1995-11-12').toISOString(),
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=Quan',
    role: 'user'
  },
  {
    id: '5',
    username: 'thu',
    displayName: 'Thu Pham',
    birthdate: new Date('1998-01-20').toISOString(),
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=Thu',
    role: 'user'
  }
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
