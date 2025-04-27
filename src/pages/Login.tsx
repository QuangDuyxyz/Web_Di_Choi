
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Không cần kiểm tra isAuthenticated ở đây nữa vì PublicOnlyRoute đã xử lý việc chuyển hướng

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Lỗi đăng nhập",
        description: "Vui lòng nhập email và mật khẩu",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng trở lại FriendVerse!"
        });
        
        // Sử dụng sessionStorage để đánh dấu đã đăng nhập thành công
        // và tạo một cơ chế anti-redirect-loop
        sessionStorage.setItem('loginSuccess', 'true');
        sessionStorage.setItem('loginTime', Date.now().toString());
        
        setTimeout(() => {
          console.log('Login successful, redirecting to timeline');
          // Sử dụng navigate để chuyển đến trang timeline
          // Vì chúng ta đã có PublicOnlyRoute, sẽ không có chuyện quay lại trang login
          navigate('/timeline', { replace: true });
        }, 1000);
      } else {
        toast({
          title: "Lỗi đăng nhập",
          description: "Email hoặc mật khẩu không đúng",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi đăng nhập",
        description: "Có lỗi xảy ra khi đăng nhập",
        variant: "destructive"
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-friendverse-blue/30 to-friendverse-purple/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">FriendVerse</CardTitle>
          <CardDescription className="text-center">
            Đăng nhập để xem timeline hội bạn thân
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>
          
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-primary hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
