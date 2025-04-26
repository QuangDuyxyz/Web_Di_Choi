
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Event } from '../types';
import { mockEvents } from '../data/mockData';
import { useToast } from "@/components/ui/use-toast";

interface EventsContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => Event | undefined;
  addWish: (eventId: string, wishContent: string, userId: string) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load events from localStorage or use mock data
    const savedEvents = localStorage.getItem('friendverse-events');
    
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (error) {
        console.error('Failed to parse saved events', error);
        setEvents(mockEvents);
        localStorage.setItem('friendverse-events', JSON.stringify(mockEvents));
      }
    } else {
      setEvents(mockEvents);
      localStorage.setItem('friendverse-events', JSON.stringify(mockEvents));
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('friendverse-events', JSON.stringify(events));
    }
  }, [events]);

  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      wishes: []
    };
    
    setEvents(prev => [...prev, newEvent]);
    toast({
      title: "Sự kiện đã được thêm",
      description: `${newEvent.title} đã được thêm vào timeline.`
    });
  };

  const updateEvent = (id: string, updatedFields: Partial<Event>) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === id ? { ...event, ...updatedFields } : event
      )
    );
    toast({
      title: "Sự kiện đã được cập nhật",
      description: `Thông tin sự kiện đã được cập nhật.`
    });
  };

  const deleteEvent = (id: string) => {
    const eventToDelete = events.find(e => e.id === id);
    setEvents(prev => prev.filter(event => event.id !== id));
    toast({
      title: "Sự kiện đã bị xóa",
      description: eventToDelete ? `"${eventToDelete.title}" đã bị xóa khỏi timeline.` : "Sự kiện đã bị xóa.",
      variant: "destructive"
    });
  };

  const getEvent = (id: string) => {
    return events.find(event => event.id === id);
  };

  const addWish = (eventId: string, wishContent: string, userId: string) => {
    setEvents(prev => 
      prev.map(event => {
        if (event.id === eventId) {
          const wishes = event.wishes || [];
          return {
            ...event,
            wishes: [
              ...wishes,
              {
                id: Date.now().toString(),
                content: wishContent,
                userId,
                createdAt: new Date().toISOString()
              }
            ]
          };
        }
        return event;
      })
    );
    toast({
      title: "Lời chúc đã được thêm",
      description: "Lời chúc của bạn đã được gửi."
    });
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        addWish
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = (): EventsContextType => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
