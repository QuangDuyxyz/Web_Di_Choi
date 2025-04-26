
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MemberManagement } from '@/components/MemberManagement';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Members = () => {
  const { isAuthenticated, isAdmin, updateUser, deleteUser } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchMembers();
  }, [isAuthenticated, navigate]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMember = async (user: User) => {
    await updateUser(user);
    await fetchMembers();
  };

  const handleDeleteMember = async (userId: string) => {
    await deleteUser(userId);
    await fetchMembers();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Thành viên</h1>
        
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

