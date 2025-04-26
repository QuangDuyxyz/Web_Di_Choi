
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Event, User } from '../types';
import { useEvents } from './EventsContext';
import { mockUsers } from '../data/mockData';

interface BirthdayContextType {
  todaysBirthdays: Event[];
  birthdayPeople: User[];
  showCelebration: boolean;
  toggleCelebration: () => void;
}

const BirthdayContext = createContext<BirthdayContextType | undefined>(undefined);

export const BirthdayProvider = ({ children }: { children: ReactNode }) => {
  const { events } = useEvents();
  const [todaysBirthdays, setTodaysBirthdays] = useState<Event[]>([]);
  const [birthdayPeople, setBirthdayPeople] = useState<User[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Check for birthdays today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const birthdays = events.filter(event => {
      const eventDate = new Date(event.date);
      const eventDateString = eventDate.toISOString().split('T')[0];
      return event.eventType === 'birthday' && eventDateString === todayString;
    });
    
    setTodaysBirthdays(birthdays);
    
    // Find the users who have birthdays today
    const birthdayUserIds = birthdays.map(birthday => {
      // Extract the user id from the birthday event id (format: "birthday-{userId}")
      const userId = birthday.id.replace('birthday-', '');
      return userId;
    });
    
    const users = mockUsers.filter(user => birthdayUserIds.includes(user.id));
    setBirthdayPeople(users);
    
    // Automatically show celebration if it's someone's birthday
    if (birthdays.length > 0) {
      setShowCelebration(true);
    }
  }, [events]);
  
  const toggleCelebration = () => {
    setShowCelebration(prev => !prev);
  };

  return (
    <BirthdayContext.Provider
      value={{
        todaysBirthdays,
        birthdayPeople,
        showCelebration,
        toggleCelebration
      }}
    >
      {children}
    </BirthdayContext.Provider>
  );
};

export const useBirthday = (): BirthdayContextType => {
  const context = useContext(BirthdayContext);
  if (!context) {
    throw new Error('useBirthday must be used within a BirthdayProvider');
  }
  return context;
};
