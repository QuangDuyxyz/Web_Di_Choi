
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventForm } from '@/components/EventForm';
import { useAuth } from '@/contexts/AuthContext';

const AddEvent = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Thêm sự kiện mới</h1>
        
        <EventForm />
      </main>
      
      <Footer />
    </div>
  );
};

export default AddEvent;
