import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MemberManagement } from '@/components/MemberManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import { User } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Safely initialize Supabase with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if both URL and key are present
const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey) : 
  null;

const Members = () => {
  const { isAuthenticated, isAdmin, updateUser, deleteUser } = useAuth();
  const { resetEvents } = useEvents();
  const navigate = useNavigate();
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchMembers();
  }, [isAuthenticated, navigate]);

  const fetchMembers = async () => {
    try {
      // Mảng để lưu tất cả thành viên
      let allMembers: User[] = [];
      
      // Thêm thành viên từ mockUsers (chỉ admin)
      allMembers = [...mockUsers];
      
      // Thêm thành viên đã đăng ký trong phiên làm việc hiện tại
      if (window.registeredMockUsers && window.registeredMockUsers.length > 0) {
        allMembers = [...allMembers, ...window.registeredMockUsers];
        console.log('Đã thêm thành viên đã đăng ký:', window.registeredMockUsers.length);
      }
      
      // Nếu Supabase được cấu hình, thử lấy thành viên từ Supabase
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });

          if (error) {
            console.error('Supabase error:', error);
          } else if (Array.isArray(data) && data.length > 0) {
            // Convert Supabase profile format to our User format
            const formattedUsers: User[] = data.map(profile => ({
              id: profile.id,
              username: profile.username || '',
              email: profile.email || '',
              displayName: profile.display_name || profile.username || '',
              birthdate: profile.birthdate || '',
              avatar: profile.avatar || `https://api.dicebear.com/7.x/avatars/svg?seed=${profile.username}`,
              role: profile.role || 'user'
            }));
            
            // Thêm thành viên từ Supabase vào danh sách
            allMembers = [...allMembers, ...formattedUsers];
            console.log('Loaded users from Supabase:', formattedUsers.length);
          }
        } catch (supabaseError) {
          console.error('Error fetching from Supabase:', supabaseError);
        }
      }
      
      // Loại bỏ các thành viên trùng lặp (nếu có)
      const uniqueMembers = allMembers.filter((member, index, self) => 
        index === self.findIndex(m => m.id === member.id)
      );
      
      setMembers(uniqueMembers);
      console.log('Tổng số thành viên đã tải:', uniqueMembers.length);
    } catch (error) {
      console.error('Error fetching members:', error);
      // Fallback to mock data in case of error
      setMembers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMember = async (user: User) => {
    await updateUser(user);
    await fetchMembers();
  };

  const handleDeleteMember = async (userId: string) => {
    try {
      await deleteUser(userId);
      // Cập nhật danh sách thành viên ngay lập tức mà không cần gọi lại fetchMembers
      setMembers(prev => prev.filter(member => member.id !== userId));
      console.log('Thành viên đã được xóa và UI đã được cập nhật');
    } catch (error) {
      console.error('Lỗi khi xóa thành viên:', error);
      // Nếu có lỗi thì mới gọi lại fetchMembers
      await fetchMembers();
    }
  };

  // Hàm xử lý reset dữ liệu
  const handleResetData = () => {
    try {
      // Sử dụng hàm resetEvents đã được cải tiến để xóa tất cả dữ liệu
      resetEvents();
      
      // Reset dữ liệu thành viên (chỉ có admin mới có quyền này)
      if (isAdmin) {
        // Đặt lại danh sách thành viên về mặc định
        setMembers(mockUsers);
        
        // Xóa biến toàn cục lưu trữ các tài khoản đã đăng ký
        if (window.registeredMockUsers) {
          window.registeredMockUsers = [];
        }
        
        console.log('Tất cả dữ liệu thành viên đã được reset');
      }
      
      // Đóng hộp thoại xác nhận
      setShowResetConfirm(false);
      
      // Thông báo đã được hiển thị trong hàm resetEvents
    } catch (error) {
      console.error('Lỗi khi reset dữ liệu:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi reset dữ liệu.",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Thành viên</h1>
          
          {isAdmin && (
            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận reset dữ liệu</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa tất cả dữ liệu hiện tại và khôi phục về trạng thái ban đầu không?
                    Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground">
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        {isAdmin ? (
          <MemberManagement
            members={members}
            onUpdate={handleUpdateMember}
            onDelete={handleDeleteMember}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
              <div
                key={member.id}
                className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={member.avatar}
                    alt={member.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">{member.displayName}</h3>
                    <p className="text-sm text-muted-foreground">@{member.username}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Members;
