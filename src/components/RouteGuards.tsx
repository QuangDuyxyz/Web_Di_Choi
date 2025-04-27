import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

/**
 * Component bảo vệ các route yêu cầu đăng nhập
 * Nếu người dùng chưa đăng nhập, sẽ chuyển hướng về trang đăng nhập
 */
export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [isChecked, setIsChecked] = useState(false);

  // Sau khi kiểm tra xong trạng thái đăng nhập, đánh dấu đã kiểm tra
  useEffect(() => {
    if (!isLoading) {
      setIsChecked(true);
    }
  }, [isLoading]);

  // Hiển thị loading khi đang xác thực
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  // Chỉ chuyển hướng khi đã kiểm tra xong và chưa đăng nhập
  if (isChecked && !isAuthenticated) {
    console.log('PrivateRoute: Redirecting to login, not authenticated');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Đã đăng nhập, hiển thị nội dung
  return <Outlet />;
};

/**
 * Component dành cho các route chỉ hiển thị khi chưa đăng nhập (login/register)
 * Nếu người dùng đã đăng nhập, sẽ chuyển hướng về trang timeline
 */
export const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [isChecked, setIsChecked] = useState(false);
  
  // Kiểm tra đã hoàn thành
  useEffect(() => {
    if (!isLoading) {
      setIsChecked(true);
    }
  }, [isLoading]);

  // Hiển thị loading khi đang xác thực
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  // Nếu đã kiểm tra xong và đã đăng nhập, chuyển hướng
  if (isChecked && isAuthenticated) {
    // Lấy đường dẫn trước đó nếu có, nếu không thì chuyển về timeline
    const from = location.state?.from || '/timeline';
    console.log('PublicOnlyRoute: Already authenticated, redirecting to', from);
    return <Navigate to={from} replace />;  
  }

  // Chưa đăng nhập, hiển thị nội dung đăng nhập/đăng ký
  return <Outlet />;
};
