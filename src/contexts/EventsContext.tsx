
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Event } from '../types';
import { mockEvents } from '../data/mockData';
import { useToast } from "@/components/ui/use-toast";
import { SyncService } from '@/lib/syncService';

interface EventsContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => Event | undefined;
  addWish: (eventId: string, wishContent: string, userId: string) => void;
  resetEvents: () => void; // Thêm hàm reset dữ liệu
  clearAllEvents: () => void; // Thêm hàm xóa tất cả sự kiện
  toggleLike: (eventId: string, userId: string) => void; // Thêm/xóa like
  isLikedByUser: (eventId: string, userId: string) => boolean; // Kiểm tra xem người dùng đã thích sự kiện chưa
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Kiểm tra đồng bộ từ cloud trước
    const cloudData = SyncService.loadFromCloud();
    if (cloudData && cloudData.events && cloudData.events.length > 0) {
      setEvents(cloudData.events);
      console.log('Loaded events from cloud sync:', cloudData.events.length);
    } else {
      // Nếu không có dữ liệu từ cloud, thử từ localStorage
      const savedEvents = localStorage.getItem('friendverse-events');
      
      if (savedEvents) {
        try {
          const parsedEvents = JSON.parse(savedEvents);
          if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
            setEvents(parsedEvents);
            console.log('Loaded events from localStorage:', parsedEvents.length);
            
            // Đồng bộ lên cloud
            SyncService.saveToCloud({ events: parsedEvents });
          } else {
            console.warn('Saved events array is empty or invalid, using mock data');
            setEvents(mockEvents);
            localStorage.setItem('friendverse-events', JSON.stringify(mockEvents));
            SyncService.saveToCloud({ events: mockEvents });
          }
        } catch (error) {
          console.error('Failed to parse saved events', error);
          setEvents(mockEvents);
          localStorage.setItem('friendverse-events', JSON.stringify(mockEvents));
          SyncService.saveToCloud({ events: mockEvents });
        }
      } else {
        console.log('No saved events found, using mock data');
        setEvents(mockEvents);
        localStorage.setItem('friendverse-events', JSON.stringify(mockEvents));
        SyncService.saveToCloud({ events: mockEvents });
      }
    }
  }, []);

  // Save events to localStorage and cloud whenever they change
  useEffect(() => {
    // Only save if events array is valid
    if (Array.isArray(events) && events.length >= 0) {
      try {
        // Lưu vào localStorage
        localStorage.setItem('friendverse-events', JSON.stringify(events));
        console.log('Saved events to localStorage:', events.length);
        
        // Đồng bộ lên cloud
        SyncService.saveToCloud({ events });
      } catch (error) {
        console.error('Failed to save events to localStorage:', error);
      }
    }
  }, [events]);

  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      wishes: [],
      likes: []
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

  // Hàm để reset tất cả sự kiện về dữ liệu mặc định và xóa tất cả dữ liệu cũ
  const resetEvents = () => {
    try {
      // Xóa tất cả dữ liệu cũ trong localStorage
      const keysToKeep = ['theme', 'friendverse_cloud_data']; // Thêm cloud_data vào danh sách cần giữ lại
      
      // Lấy tất cả các key trong localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          // Xóa tất cả các key không nằm trong danh sách cần giữ lại
          localStorage.removeItem(key);
          console.log(`Đã xóa dữ liệu: ${key}`);
        }
      }
      
      // Đặt lại dữ liệu sự kiện mặc định
      setEvents(mockEvents);
      localStorage.setItem('friendverse-events', JSON.stringify(mockEvents));
      
      // Đồng bộ dữ liệu mặc định lên cloud
      SyncService.saveToCloud({ events: mockEvents });
      
      toast({
        title: "Đã reset dữ liệu",
        description: "Tất cả dữ liệu đã được đặt lại về mặc định.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Lỗi khi reset dữ liệu:', error);
      toast({
        title: "Lỗi reset dữ liệu",
        description: "Đã xảy ra lỗi khi reset dữ liệu: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  // Hàm để xóa tất cả sự kiện (không xóa các dữ liệu khác)
  const clearAllEvents = () => {
    try {
      // Xóa tất cả sự kiện
      setEvents([]);
      localStorage.setItem('friendverse-events', JSON.stringify([]));
      
      // Đồng bộ dữ liệu trống lên cloud
      SyncService.saveToCloud({ events: [] });
      
      toast({
        title: "Đã xóa tất cả sự kiện",
        description: "Tất cả sự kiện đã bị xóa.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Lỗi khi xóa tất cả sự kiện:', error);
      toast({
        title: "Lỗi khi xóa sự kiện",
        description: "Đã xảy ra lỗi khi xóa tất cả sự kiện: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  // Thêm/xóa like cho sự kiện
  const toggleLike = (eventId: string, userId: string) => {
    setEvents(prev => 
      prev.map(event => {
        if (event.id === eventId) {
          const likes = event.likes || [];
          const userLikedIndex = likes.indexOf(userId);
          
          if (userLikedIndex === -1) {
            // Người dùng chưa thích sự kiện, thêm like
            return {
              ...event,
              likes: [...likes, userId]
            };
          } else {
            // Người dùng đã thích sự kiện, xóa like
            return {
              ...event,
              likes: likes.filter(id => id !== userId)
            };
          }
        }
        return event;
      })
    );
  };

  // Kiểm tra xem người dùng đã thích sự kiện chưa
  const isLikedByUser = (eventId: string, userId: string): boolean => {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.likes) return false;
    return event.likes.includes(userId);
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        addWish,
        resetEvents,
        clearAllEvents,
        toggleLike,
        isLikedByUser
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
