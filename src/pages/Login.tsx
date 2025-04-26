
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Lỗi đăng nhập",
        description: "Vui lòng nhập tên đăng nhập và mật khẩu",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng trở lại FriendVerse!"
        });
        navigate('/');
      } else {
        toast({
          title: "Lỗi đăng nhập",
          description: "Tên đăng nhập hoặc mật khẩu không đúng",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi đăng nhập",
        description: "Có lỗi xảy ra khi đăng nhập",
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
          <CardTitle className="text-2xl font-bold text-center">FriendVerse</CardTitle>
          <CardDescription className="text-center">
            Đăng nhập để xem timeline hội bạn thân
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Tên đăng nhập
              </label>
              <Input
                id="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mật khẩu
                </label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              {/* In mock version, tell users about mock accounts */}
              Tài khoản để đăng nhập thử: <br />
              Admin: admin <br />
              User: minh, linh, quan, thu <br />
              (Không cần mật khẩu trong phiên bản demo này)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
