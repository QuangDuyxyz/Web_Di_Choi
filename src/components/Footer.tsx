
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FriendVerse
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Timeline hội bạn thân
            </p>
          </div>
          
          <div className="flex space-x-4 mb-4 md:mb-0">
            <Link to="/" className="text-gray-500 hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link to="/timeline" className="text-gray-500 hover:text-primary transition-colors">
              Timeline
            </Link>
            <Link to="/members" className="text-gray-500 hover:text-primary transition-colors">
              Thành viên
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            &copy; {currentYear} FriendVerse. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
