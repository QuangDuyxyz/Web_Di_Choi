
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { CalendarIcon, Home, LogOut, User, Users, PlusCircle, MessageSquare } from 'lucide-react';
import { useBirthday } from '@/contexts/BirthdayContext';
import { useChat } from '@/contexts/ChatContext';
import { motion } from 'framer-motion';

export const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { birthdayPeople } = useBirthday();
  const { chatGroups, messages } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const handleLogout = () => {
    // Chỉ gọi logout() và để AuthContext xử lý việc chuyển hướng
    // Vì logout() trong AuthContext đã có window.location.href = '/';
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Kiểm tra tin nhắn chưa đọc
  useEffect(() => {
    if (!user) return;
    
    // Lấy các nhóm chat mà người dùng là thành viên
    const userGroups = chatGroups.filter(group => group.members.includes(user.id));
    
    // Đếm số tin nhắn chưa đọc
    let count = 0;
    userGroups.forEach(group => {
      const groupMessages = messages[group.id] || [];
      count += groupMessages.filter(msg => 
        msg.senderId !== user.id && !msg.readBy.includes(user.id)
      ).length;
    });
    
    setUnreadMessages(count);
  }, [user, chatGroups, messages]);

  // Kiểm tra xem đường dẫn hiện tại có đang active không
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white shadow-sm border-b sticky top-0 z-10"
    >
      <div className="container max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <motion.span 
            className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold text-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            FriendVerse
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className={cn(
            "flex items-center gap-1 transition-all duration-200 relative py-1 px-2 rounded-md",
            isActive("/") && location.pathname === "/" ? "text-primary font-medium bg-primary/5" : "hover:text-primary hover:bg-primary/5"
          )}>
            <Home size={18} />
            <span>Trang chủ</span>
          </Link>
          <Link to="/timeline" className={cn(
            "flex items-center gap-1 transition-all duration-200 relative py-1 px-2 rounded-md",
            isActive("/timeline") ? "text-primary font-medium bg-primary/5" : "hover:text-primary hover:bg-primary/5"
          )}>
            <CalendarIcon size={18} />
            <span>Timeline</span>
          </Link>
          <Link to="/members" className={cn(
            "flex items-center gap-1 transition-all duration-200 relative py-1 px-2 rounded-md",
            isActive("/members") ? "text-primary font-medium bg-primary/5" : "hover:text-primary hover:bg-primary/5"
          )}>
            <Users size={18} />
            <span>Thành viên</span>
          </Link>
          <Link to="/chat" className={cn(
            "flex items-center gap-1 transition-all duration-200 relative py-1 px-2 rounded-md",
            isActive("/chat") ? "text-primary font-medium bg-primary/5" : "hover:text-primary hover:bg-primary/5"
          )}>
            <MessageSquare size={18} />
            <span>Trò chuyện</span>
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center px-1">
                {unreadMessages}
              </Badge>
            )}
          </Link>
          {isAdmin && (
            <Link to="/add-event" className={cn(
              "flex items-center gap-1 transition-all duration-200 relative py-1 px-2 rounded-md",
              isActive("/add-event") ? "text-primary font-medium bg-primary/5" : "hover:text-primary hover:bg-primary/5"
            )}>
              <PlusCircle size={18} />
              <span>Thêm sự kiện</span>
            </Link>
          )}
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative p-0 h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={user?.avatar} alt={user?.displayName} />
                      <AvatarFallback>{user ? getInitials(user.displayName) : 'U'}</AvatarFallback>
                    </Avatar>
                    {birthdayPeople.some(person => person.id === user?.id) && (
                      <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-secondary animate-pulse"></span>
                    )}
                    {unreadMessages > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center px-1"
                      >
                        {unreadMessages}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="py-2">
                  <User className="mr-2 h-4 w-4" />
                  <span>Hồ sơ</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/chat')} className="py-2">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Trò chuyện</span>
                  {unreadMessages > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadMessages}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="py-2 text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/login')} variant="default">
              Đăng nhập
            </Button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex items-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-2 space-y-2">
            <Link
              to="/"
              className="block py-2 hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Trang chủ
            </Link>
            <Link
              to="/timeline"
              className="block py-2 hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Timeline
            </Link>
            <Link
              to="/members"
              className="block py-2 hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Thành viên
            </Link>
            {isAdmin && (
              <Link
                to="/add-event"
                className="block py-2 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Thêm sự kiện
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Hồ sơ
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-primary"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block py-2 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </motion.header>
  );
};
