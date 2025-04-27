
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { RegisterFormData } from '@/types';

const Register = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    username: '',
    displayName: '',
    birthdate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Không cần kiểm tra isAuthenticated ở đây nữa vì PublicOnlyRoute đã xử lý việc chuyển hướng

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra dữ liệu trước khi đăng ký
    if (!formData.email || !formData.password || !formData.username || !formData.displayName) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin đăng ký",
        variant: "destructive"
      });
      return;
    }
    
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email không hợp lệ",
        description: "Vui lòng nhập đúng định dạng email",
        variant: "destructive"
      });
      return;
    }
    
    // Kiểm tra độ dài mật khẩu
    if (formData.password.length < 6) {
      toast({
        title: "Mật khẩu quá ngắn",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive"
      });
      return;
    }
    
    // Hiển thị trạng thái đang xử lý
    setIsLoading(true);
    toast({
      title: "Đang xử lý",
      description: "Đang đăng ký tài khoản..."
    });

    try {
      const success = await register(formData);
      if (success) {
        toast({
          title: "Đăng ký thành công",
          description: "Chào mừng bạn đến với FriendVerse!"
        });
        
        // Sử dụng sessionStorage để đánh dấu đã đăng ký thành công
        // và tạo một cơ chế anti-redirect-loop
        sessionStorage.setItem('registerSuccess', 'true');
        sessionStorage.setItem('registerTime', Date.now().toString());
        
        setTimeout(() => {
          console.log('Registration successful, redirecting to timeline');
          // Sử dụng navigate để chuyển đến trang timeline
          // Vì chúng ta đã có PublicOnlyRoute, sẽ không có chuyện quay lại trang đăng ký
          navigate('/timeline', { replace: true });
        }, 1500); // Giữ nguyên thời gian trễ để đảm bảo người dùng thấy thông báo
      } else {
        // Nếu register trả về false (ví dụ email đã tồn tại)
        toast({
          title: "Lỗi đăng ký",
          description: "Email có thể đã được sử dụng hoặc có lỗi xảy ra. Vui lòng thử lại.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      toast({
        title: "Lỗi đăng ký",
        description: "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-friendverse-blue/30 to-friendverse-purple/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đăng ký FriendVerse</CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản để kết nối với bạn bè
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tạo mật khẩu"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                placeholder="Chọn tên đăng nhập"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                placeholder="Nhập tên hiển thị"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">Ngày sinh</Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthdate: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký"}
            </Button>

            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

