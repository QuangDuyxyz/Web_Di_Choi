
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers } from '@/data/mockData';
import { getMonthAndDay } from '@/utils/dateUtils';

const Members = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Thành viên</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockUsers.map(user => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{user.displayName}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    <p className="text-sm mt-1">Sinh nhật: {getMonthAndDay(user.birthdate)}</p>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        user.role === 'admin' 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Thành viên'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Members;
