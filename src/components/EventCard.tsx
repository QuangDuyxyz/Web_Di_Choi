
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Event, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import { mockUsers } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  formatDate,
  getRelativeTime,
  calculateTimeLeft,
  isToday
} from '@/utils/dateUtils';
import { Edit, Trash2, Heart, MessageSquare, MoreHorizontal, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
}

export const EventCard = ({ event, onEdit }: EventCardProps) => {
  const { isAdmin, user } = useAuth();
  const { updateEvent, deleteEvent, addWish, toggleLike, isLikedByUser } = useEvents();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(event.date));
  const [showCountdown, setShowCountdown] = useState(true);
  const [showWishForm, setShowWishForm] = useState(false);
  const [wishContent, setWishContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [creator, setCreator] = useState<User | null>(null);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Refresh countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(event.date));
    }, 1000);

    return () => clearInterval(timer);
  }, [event.date]);

  // Find the creator of the event
  useEffect(() => {
    // Tìm trong mockUsers
    let eventCreator = mockUsers.find(u => u.id === event.createdBy);
    
    // Nếu không tìm thấy, kiểm tra trong registeredMockUsers
    if (!eventCreator && window.registeredMockUsers) {
      eventCreator = window.registeredMockUsers.find(u => u.id === event.createdBy);
    }
    
    if (eventCreator) {
      setCreator(eventCreator);
    }
  }, [event]);

  const handleLike = () => {
    if (!user) return;
    
    // Kích hoạt hiệu ứng animation
    setIsLikeAnimating(true);
    
    // Gọi hàm toggleLike từ context
    toggleLike(event.id, user.id);
    
    // Kết thúc animation sau 1 giây
    setTimeout(() => setIsLikeAnimating(false), 1000);
  };

  const handleSubmitWish = () => {
    if (wishContent.trim() && user) {
      addWish(event.id, wishContent, user.id);
      setWishContent('');
      setShowWishForm(false);
    }
  };

  const handleDelete = () => {
    try {
      // Xóa sự kiện
      deleteEvent(event.id);
      
      // Kiểm tra xem dữ liệu đã được lưu vào localStorage chưa
      setTimeout(() => {
        const savedEvents = localStorage.getItem('friendverse-events');
        if (savedEvents) {
          try {
            const parsedEvents = JSON.parse(savedEvents);
            const eventStillExists = parsedEvents.some((e: Event) => e.id === event.id);
            
            if (eventStillExists) {
              console.error('Sự kiện vẫn còn tồn tại sau khi xóa, thực hiện xóa lại');
              // Nếu sự kiện vẫn còn, xóa trực tiếp từ localStorage
              const updatedEvents = parsedEvents.filter((e: Event) => e.id !== event.id);
              localStorage.setItem('friendverse-events', JSON.stringify(updatedEvents));
              console.log('Đã xóa sự kiện trực tiếp từ localStorage');
            } else {
              console.log('Sự kiện đã được xóa thành công');
            }
          } catch (error) {
            console.error('Lỗi khi phân tích dữ liệu localStorage:', error);
          }
        }
      }, 500);
      
      setConfirmDelete(false);
    } catch (error) {
      console.error('Lỗi khi xóa sự kiện:', error);
    }
  };

  const getCardClass = () => {
    let classes = "border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1";
    
    if (event.eventType === 'birthday' && isToday(event.date)) {
      classes += " bg-gradient-to-br from-friendverse-pink to-friendverse-purple";
    } else if (event.eventType === 'trip') {
      classes += " bg-gradient-to-br from-friendverse-blue to-friendverse-green opacity-90";
    } else if (event.eventType === 'anniversary') {
      classes += " bg-gradient-to-br from-friendverse-yellow to-friendverse-peach";
    } else if (event.eventType === 'meeting') {
      classes += " bg-gradient-to-br from-blue-400 to-purple-400";
    }
    
    return classes;
  };

  // Kiểm tra xem người dùng hiện tại đã thích sự kiện này chưa
  const userHasLiked = user ? isLikedByUser(event.id, user.id) : false;
  
  // Đếm số lượng like
  const likeCount = event.likes?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={getCardClass()}>
        <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            {event.emoji && (
              <span className="text-2xl">{event.emoji}</span>
            )}
            <h3 className="text-lg font-semibold">{event.title}</h3>
          </div>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit && onEdit(event)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Chỉnh sửa</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Xóa</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-2 text-sm text-gray-700">
          <p>{formatDate(event.date)}</p>
          <p className="font-medium text-primary">{getRelativeTime(event.date)}</p>
        </div>

        {showCountdown && timeLeft.days >= 0 && (
          <div className="flex flex-wrap gap-2 mt-3 text-center">
            <div className="bg-white/80 rounded p-1 flex-1">
              <div className="text-xl font-bold">{timeLeft.days}</div>
              <div className="text-xs">ngày</div>
            </div>
            <div className="bg-white/80 rounded p-1 flex-1">
              <div className="text-xl font-bold">{timeLeft.hours}</div>
              <div className="text-xs">giờ</div>
            </div>
            <div className="bg-white/80 rounded p-1 flex-1">
              <div className="text-xl font-bold">{timeLeft.minutes}</div>
              <div className="text-xs">phút</div>
            </div>
            <div className="bg-white/80 rounded p-1 flex-1">
              <div className="text-xl font-bold">{timeLeft.seconds}</div>
              <div className="text-xs">giây</div>
            </div>
          </div>
        )}

        <p className="mt-3 text-sm">{event.description}</p>

        {event.eventType && (
          <Badge 
            variant="outline" 
            className="mt-3 capitalize bg-white/30 backdrop-blur-sm text-primary-foreground"
          >
            {event.eventType === 'birthday' ? 'Sinh nhật' :
             event.eventType === 'anniversary' ? 'Kỷ niệm' :
             event.eventType === 'trip' ? 'Du lịch' :
             event.eventType === 'meeting' ? 'Gặp mặt' : 'Khác'}
          </Badge>
        )}

        {creator && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Avatar className="h-5 w-5 mr-1">
              <AvatarImage src={creator.avatar} alt={creator.displayName} />
              <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
            </Avatar>
            <span>Tạo bởi {creator.displayName}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between border-t mt-4">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center transition-all relative overflow-hidden",
              userHasLiked ? "text-rose-500 font-medium" : ""
            )}
            onClick={handleLike}
          >
            <motion.div
              animate={isLikeAnimating ? {
                scale: [1, 1.5, 1],
                rotate: [0, 15, -15, 0],
              } : {}}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Heart 
                className={cn(
                  "h-4 w-4 mr-1", 
                  userHasLiked ? "fill-rose-500" : ""
                )} 
              />
            </motion.div>
            <span>{userHasLiked ? "Đã thích" : "Thích"}</span>
            {likeCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 min-w-5 flex items-center justify-center px-1"
              >
                {likeCount}
              </Badge>
            )}
          </Button>

          <Dialog open={showWishForm} onOpenChange={setShowWishForm}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>Lời chúc</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gửi lời chúc</DialogTitle>
                <DialogDescription>Viết lời chúc của bạn cho sự kiện này.</DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Viết lời chúc tại đây..."
                value={wishContent}
                onChange={(e) => setWishContent(e.target.value)}
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWishForm(false)}>Hủy</Button>
                <Button onClick={handleSubmitWish}>Gửi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {event.wishes && event.wishes.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {event.wishes.length} lời chúc
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lời chúc</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-auto">
                {event.wishes.map((wish) => {
                  // Tìm kiếm người dùng từ nhiều nguồn: mockUsers, registeredMockUsers và user hiện tại
                  let wishUser = mockUsers.find(u => u.id === wish.userId);
                  
                  // Nếu không tìm thấy trong mockUsers, tìm trong registeredMockUsers
                  if (!wishUser && window.registeredMockUsers) {
                    wishUser = window.registeredMockUsers.find(u => u.id === wish.userId);
                  }
                  
                  // Nếu là người dùng hiện tại
                  if (!wishUser && user && user.id === wish.userId) {
                    wishUser = user;
                  }
                  
                  return (
                    <motion.div 
                      key={wish.id} 
                      className="p-3 bg-muted rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {wishUser && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={wishUser.avatar} alt={wishUser.displayName} />
                            <AvatarFallback>{wishUser.displayName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <span className="font-medium">
                          {wishUser?.displayName || (wish.userId === user?.id ? user.displayName : 'Người dùng không xác định')}
                        </span>
                      </div>
                      <p className="text-sm">{wish.content}</p>
                    </motion.div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa sự kiện "{event.title}" không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </motion.div>
  );
};
