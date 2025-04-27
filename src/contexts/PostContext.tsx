import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Post, PostComment, PostAttachment, PostWithComments } from '@/types/post';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

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

  // Khởi tạo dữ liệu từ localStorage nếu có
  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem('posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading posts from localStorage:', error);
      setIsLoading(false);
    }
  }, []);

  // Lưu dữ liệu posts vào localStorage khi có thay đổi
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('posts', JSON.stringify(posts));
      } catch (error) {
        console.error('Error saving posts to localStorage:', error);
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
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
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
