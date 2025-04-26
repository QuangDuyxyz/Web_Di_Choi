
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventCard } from '@/components/EventCard';
import { useEvents } from '@/contexts/EventsContext';
import { useAuth } from '@/contexts/AuthContext';
import { EventForm } from '@/components/EventForm';
import { Event, EventType } from '@/types';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const Timeline = () => {
  const { events } = useEvents();
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | undefined>(undefined);
  const [filter, setFilter] = useState<EventType | 'all'>('all');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleEditEvent = (event: Event) => {
    setCurrentEvent(event);
    setIsEditDialogOpen(true);
  };

  const filteredEvents = filter === 'all' 
    ? [...events] 
    : events.filter(event => event.eventType === filter);

  // Sort events by date
  const sortedEvents = filteredEvents.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Group events by month for timeline view
  const groupedEvents: Record<string, Event[]> = {};
  sortedEvents.forEach(event => {
    const date = new Date(event.date);
    const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
    
    if (!groupedEvents[monthYear]) {
      groupedEvents[monthYear] = [];
    }
    
    groupedEvents[monthYear].push(event);
  });

  // Get month names for display
  const getMonthName = (monthYear: string) => {
    const [month, year] = monthYear.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Timeline</h1>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tất cả
            </Button>
            <Button
              variant={filter === 'birthday' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('birthday')}
            >
              Sinh nhật
            </Button>
            <Button
              variant={filter === 'anniversary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('anniversary')}
            >
              Kỷ niệm
            </Button>
            <Button
              variant={filter === 'trip' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('trip')}
            >
              Du lịch
            </Button>
            <Button
              variant={filter === 'meeting' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('meeting')}
            >
              Gặp mặt
            </Button>
          </div>
          
          {isAdmin && (
            <Button onClick={() => navigate('/add-event')} className="mt-4 md:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm sự kiện
            </Button>
          )}
        </div>
        
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">Không có sự kiện nào.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2"></div>
            
            <div className="space-y-12">
              {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                <div key={monthYear} className="relative">
                  <div className="sticky top-20 z-10 flex justify-center mb-6">
                    <h3 className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                      {getMonthName(monthYear)}
                    </h3>
                  </div>
                  
                  <div className="space-y-8">
                    {monthEvents.map(event => (
                      <div key={event.id} className="relative flex flex-col md:flex-row items-start">
                        <div className="hidden md:block flex-1"></div>
                        
                        <div className="absolute left-6 md:left-1/2 w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 mt-4"></div>
                        
                        <div className="ml-12 md:ml-0 md:flex-1">
                          <EventCard event={event} onEdit={handleEditEvent} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sự kiện</DialogTitle>
          </DialogHeader>
          {currentEvent && (
            <EventForm editMode={true} eventToEdit={currentEvent} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timeline;
