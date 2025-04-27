import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Post, PostComment, PostAttachment, PostWithComments } from '@/types/post';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { SyncService } from '@/lib/syncService';
import { CloudSyncService } from '@/services/cloudSyncService';

interface PostContextType {
  posts: PostWithComments[];
  addPost: (content: string, attachments: PostAttachment[]) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<boolean>;
  addComment: (postId: string, content: string) => Promise<PostComment | null>;
  deleteComment: (commentId: string) => Promise<boolean>;
  toggleLike: (postId: string) => Promise<boolean>;
  isUserLiked: (postId: string) => boolean;
  getPostComments: (postId: string) => PostComment[];
  isLoading: boolean;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const usePost = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};

export const PostProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<PostWithComments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Lấy dữ liệu từ cloud thực sự (CloudSyncService) hoặc từ local
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Ưu tiên lấy dữ liệu từ CloudSyncService (đồng bộ giữa các thiết bị)
      const realCloudData = CloudSyncService.loadFromCloud();
      
      if (realCloudData && realCloudData.posts && realCloudData.posts.length > 0) {
        console.log('Loaded posts from real cloud sync:', realCloudData.posts.length);
        setPosts(realCloudData.posts as PostWithComments[]);
        setIsLoading(false);
        return;
      }
      
      // Nếu không có từ CloudSyncService, thử SyncService
      const cloudData = SyncService.loadFromCloud();
      if (cloudData && cloudData.posts && cloudData.posts.length > 0) {
        setPosts(cloudData.posts as PostWithComments[]);
        console.log('Loaded posts from local cloud sync:', cloudData.posts.length);
        
        // Đồng bộ lên CloudSyncService
        await CloudSyncService.saveToCloud({ posts: cloudData.posts });
        setIsLoading(false);
        return;
      }
      
      // Nếu không có dữ liệu từ cloud, thử từ localStorage
      const savedPosts = localStorage.getItem('posts');
      if (savedPosts) {
        const parsedPosts = JSON.parse(savedPosts);
        setPosts(parsedPosts);
        console.log('Loaded posts from localStorage:', parsedPosts.length);
        
        // Đồng bộ lên cả hai cloud
        SyncService.saveToCloud({ posts: parsedPosts });
        await CloudSyncService.saveToCloud({ posts: parsedPosts });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setIsLoading(false);
    }
  }, []);
  
  // Khởi tạo dữ liệu khi component mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  
  // Lắng nghe sự kiện đồng bộ dữ liệu từ các thiết bị/tab khác
  useEffect(() => {
    const handleDataSync = (event: CustomEvent) => {
      console.log('Received data sync event:', event.detail);
      
      if (event.detail?.data?.posts) {
        // Lấy dữ liệu posts từ sự kiện
        const syncedPosts = event.detail.data.posts;
        
        // Cập nhật state nếu có dữ liệu mới
        if (syncedPosts && syncedPosts.length > 0) {
          setPosts(prevPosts => {
            // Kết hợp dữ liệu mới và dữ liệu hiện tại
            const mergedPosts = CloudSyncService.mergeData<PostWithComments>(
              prevPosts, 
              syncedPosts as PostWithComments[],
              'id'
            );
            return mergedPosts;
          });
        }
      }
    };
    
    // Đăng ký lắng nghe sự kiện đồng bộ
    window.addEventListener('friendverse_data_sync', handleDataSync as EventListener);
    
    // Thêm lắng nghe cho sự kiện yêu cầu đồng bộ
    const handleRequestSync = () => {
      loadPosts();
    };
    window.addEventListener('friendverse_request_sync', handleRequestSync);
    
    return () => {
      window.removeEventListener('friendverse_data_sync', handleDataSync as EventListener);
      window.removeEventListener('friendverse_request_sync', handleRequestSync);
    };
  }, [loadPosts]);

  // Lưu dữ liệu posts vào localStorage và cloud khi có thay đổi
  useEffect(() => {
    if (!isLoading) {
      try {
        // Lưu vào localStorage
        localStorage.setItem('posts', JSON.stringify(posts));
        
        // Đồng bộ lên cả hai cloud
        SyncService.saveToCloud({ posts });
        CloudSyncService.saveToCloud({ posts });
        
        console.log('Saved posts to storage and clouds:', posts.length);
      } catch (error) {
        console.error('Error saving posts:', error);
      }
    }
  }, [posts, isLoading]);

  const addPost = async (content: string, attachments: PostAttachment[]): Promise<Post | null> => {
    try {
      if (!user) {
        toast({
          title: "Lỗi",
          description: "Bạn phải đăng nhập để đăng bài",
          variant: "destructive"
        });
        return null;
      }

      const newPost: PostWithComments = {
        id: uuidv4(),
        userId: user.id,
        content,
        attachments: attachments.map(attachment => ({
          ...attachment,
          id: uuidv4()
        })),
        likes: [],
        commentsCount: 0,
        comments: [],
        createdAt: new Date().toISOString(),
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      // Đồng bộ posts lên cả hai cloud ngay lập tức
      const updatedPosts = [newPost, ...posts];
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
      SyncService.saveToCloud({ posts: updatedPosts });
      CloudSyncService.saveToCloud({ posts: updatedPosts });

      toast({
        title: "Thành công",
        description: "Đã đăng bài viết mới",
      });

      return newPost;
    } catch (error) {
      console.error('Error adding post:', error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng bài viết",
        variant: "destructive"
      });
      return null;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const updatedPosts = posts.filter(post => post.id !== postId);
      setPosts(updatedPosts);
      
      // Đồng bộ posts mới lên cả hai cloud ngay lập tức
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
      SyncService.saveToCloud({ posts: updatedPosts });
      CloudSyncService.saveToCloud({ posts: updatedPosts });
      
      toast({
        title: "Thành công",
        description: "Đã xóa bài viết",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết",
        variant: "destructive"
      });
      return false;
    }
  };

  const addComment = async (postId: string, content: string): Promise<PostComment | null> => {
    try {
      if (!user) {
        toast({
          title: "Lỗi",
          description: "Bạn phải đăng nhập để bình luận",
          variant: "destructive"
        });
        return null;
      }

      const newComment: PostComment = {
        id: uuidv4(),
        postId,
        userId: user.id,
        content,
        createdAt: new Date().toISOString()
      };

      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment],
              commentsCount: post.commentsCount + 1
            };
          }
          return post;
        })
      );

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm bình luận",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          const commentIndex = post.comments.findIndex(comment => comment.id === commentId);
          if (commentIndex !== -1) {
            const updatedComments = post.comments.filter(comment => comment.id !== commentId);
            return {
              ...post,
              comments: updatedComments,
              commentsCount: post.commentsCount - 1
            };
          }
          return post;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bình luận",
        variant: "destructive"
      });
      return false;
    }
  };

  const toggleLike = async (postId: string): Promise<boolean> => {
    try {
      if (!user) {
        toast({
          title: "Lỗi",
          description: "Bạn phải đăng nhập để thích bài viết",
          variant: "destructive"
        });
        return false;
      }

      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const hasLiked = post.likes.some(like => like.userId === user.id);
            
            if (hasLiked) {
              // Bỏ thích
              return {
                ...post,
                likes: post.likes.filter(like => like.userId !== user.id)
              };
            } else {
              // Thêm thích
              return {
                ...post,
                likes: [...post.likes, { userId: user.id, createdAt: new Date().toISOString() }]
              };
            }
          }
          return post;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thích bài viết",
        variant: "destructive"
      });
      return false;
    }
  };

  const isUserLiked = (postId: string): boolean => {
    if (!user) return false;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return false;
    
    return post.likes.some(like => like.userId === user.id);
  };

  const getPostComments = (postId: string): PostComment[] => {
    const post = posts.find(p => p.id === postId);
    return post ? post.comments : [];
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        addPost,
        deletePost,
        addComment,
        deleteComment,
        toggleLike,
        isUserLiked,
        getPostComments,
        isLoading
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
