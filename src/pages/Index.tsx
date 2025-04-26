
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BirthdayCelebration } from '@/components/BirthdayCelebration';
import { EventCard } from '@/components/EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { useBirthday } from '@/contexts/BirthdayContext';
import { useEvents } from '@/contexts/EventsContext';
import { CalendarIcon, Users } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { birthdayPeople, todaysBirthdays, showCelebration } = useBirthday();
  const { events } = useEvents();
  
  // Get upcoming events (next 5 events)
  const today = new Date();
  const upcomingEvents = [...events]
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FriendVerse
            </h1>
            <p className="text-xl mb-8">Timeline hội bạn thân</p>
            <p className="mb-8 text-gray-600">
              Chào mừng đến với FriendVerse, nơi lưu giữ những kỷ niệm đặc biệt của nhóm bạn thân. 
              Đăng nhập để xem timeline sự kiện, sinh nhật và các hoạt động sắp tới!
            </p>
            
            <Button size="lg" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Birthday celebration popup */}
      <BirthdayCelebration />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 space-y-8">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Chào mừng, {user?.displayName}!</h2>
              </div>
              
              {/* Today's birthday section */}
              {birthdayPeople.length > 0 && (
                <Card className="mb-6 bg-gradient-to-br from-friendverse-pink to-friendverse-purple">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3">
                      🎂 Hôm nay là sinh nhật!
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {birthdayPeople.map(person => (
                        <div key={person.id} className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                            <img 
                              src={person.avatar} 
                              alt={person.displayName} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span>{person.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                {todaysBirthdays.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Sắp tới</h2>
                <Button variant="ghost" onClick={() => navigate('/timeline')}>
                  Xem tất cả
                </Button>
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p>Không có sự kiện sắp tới nào.</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Truy cập nhanh</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/timeline')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Timeline
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/members')}>
                    <Users className="mr-2 h-4 w-4" />
                    Thành viên
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
