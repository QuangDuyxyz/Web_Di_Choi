
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { CalendarIcon, Home, LogOut, User, Users, PlusCircle } from 'lucide-react';
import { useBirthday } from '@/contexts/BirthdayContext';

export const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { birthdayPeople } = useBirthday();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="container max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold text-xl">
            FriendVerse
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home size={18} />
            <span>Trang chủ</span>
          </Link>
          <Link to="/timeline" className="flex items-center gap-1 hover:text-primary transition-colors">
            <CalendarIcon size={18} />
            <span>Timeline</span>
          </Link>
          <Link to="/members" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Users size={18} />
            <span>Thành viên</span>
          </Link>
          {isAdmin && (
            <Link to="/add-event" className="flex items-center gap-1 hover:text-primary transition-colors">
              <PlusCircle size={18} />
              <span>Thêm sự kiện</span>
            </Link>
          )}
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative p-0 h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.displayName} />
                    <AvatarFallback>{user ? getInitials(user.displayName) : 'U'}</AvatarFallback>
                  </Avatar>
                  {birthdayPeople.some(person => person.id === user?.id) && (
                    <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-secondary"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Hồ sơ</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
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
    </header>
  );
};
