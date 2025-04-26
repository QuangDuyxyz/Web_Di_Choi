
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

const Profile = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Hồ sơ cá nhân</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="font-semibold text-lg">{user.displayName}</h3>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Vai trò</span>
                    <span className="font-medium capitalize">{user.role}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Ngày sinh</span>
                    <span className="font-medium">{formatDate(user.birthdate)}</span>
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  className="mt-8"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
