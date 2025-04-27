import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostWithComments } from '@/types/post';
import { usePost } from '@/contexts/PostContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { Heart, MessageSquare, Trash2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

interface PostItemProps {
  post: PostWithComments;
  onDelete?: () => void;
}

export const PostItem = ({ post }: PostItemProps) => {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  
  const { user } = useAuth();
  const { toggleLike, isUserLiked, addComment, deleteComment, deletePost } = usePost();
  
  // Tìm người dùng đã đăng bài
  const getUser = (userId: string): User | undefined => {
    // Tìm trong mock data
    const mockUser = mockUsers.find(u => u.id === userId);
    if (mockUser) return mockUser;
    
    // Tìm trong registeredMockUsers (nếu có)
    if (window.registeredMockUsers) {
      const registeredUser = window.registeredMockUsers.find(u => u.id === userId);
      if (registeredUser) return registeredUser;
    }
    
    // User hiện tại
    if (user && user.id === userId) return user;
    
    return undefined;
  };

  const postAuthor = getUser(post.userId);
  
  const handleLike = async () => {
    await toggleLike(post.id);
  };
  
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const result = await addComment(post.id, comment.trim());
      if (result) {
        setComment('');
        if (!showComments) setShowComments(true);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePostDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      await deletePost(post.id);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      await deleteComment(commentId);
    }
  };
  
  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={postAuthor?.avatar} alt={postAuthor?.displayName} />
                <AvatarFallback>{postAuthor?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{postAuthor?.displayName || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{formatRelativeTime(post.createdAt)}</div>
              </div>
            </div>
            
            {(user?.id === post.userId || user?.role === 'admin') && (
              <Button variant="ghost" size="sm" onClick={handlePostDelete}>
                <Trash2 size={16} />
              </Button>
            )}
          </div>
          
          {/* Content */}
          <div className="mb-3 whitespace-pre-wrap">{post.content}</div>
          
          {/* Attachments */}
          {post.attachments.length > 0 && (
            <div className={`grid gap-2 mb-3 ${post.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.attachments.map((attachment, index) => (
                <div 
                  key={attachment.id} 
                  className="cursor-pointer"
                  onClick={() => openFullscreen(index)}
                >
                  {attachment.type === 'image' ? (
                    <img 
                      src={attachment.url} 
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-[200px] object-cover rounded-md"
                    />
                  ) : (
                    <video 
                      src={attachment.url}
                      className="w-full h-[200px] object-cover rounded-md"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Dialog for fullscreen view */}
          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
              <div className="bg-black rounded-lg overflow-hidden">
                {post.attachments[fullscreenIndex]?.type === 'image' ? (
                  <img 
                    src={post.attachments[fullscreenIndex]?.url}
                    alt="Fullscreen view"
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                ) : (
                  <video 
                    src={post.attachments[fullscreenIndex]?.url}
                    className="w-full h-auto max-h-[80vh]"
                    controls
                    autoPlay
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Like & Comment Count */}
          {(post.likes.length > 0 || post.commentsCount > 0) && (
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              {post.likes.length > 0 && (
                <div className="flex items-center gap-1">
                  <Heart size={14} className="fill-red-500 text-red-500" />
                  <span>{post.likes.length}</span>
                </div>
              )}
              
              {post.commentsCount > 0 && (
                <div 
                  className="cursor-pointer hover:underline"
                  onClick={() => setShowComments(!showComments)}
                >
                  {post.commentsCount} bình luận
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-0">
          <div className="w-full">
            {/* Like & Comment Buttons */}
            <div className="flex justify-between p-2 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex-1 ${isUserLiked(post.id) ? 'text-primary' : ''}`} 
                onClick={handleLike}
              >
                <Heart 
                  size={18} 
                  className={isUserLiked(post.id) ? 'mr-1 fill-primary text-primary' : 'mr-1'} 
                />
                Thích
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1" 
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare size={18} className="mr-1" />
                Bình luận
              </Button>
            </div>
            
            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 border-t border-gray-100"
                >
                  {/* Comment List */}
                  {post.comments.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {post.comments.map(comment => {
                        const commentAuthor = getUser(comment.userId);
                        return (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={commentAuthor?.avatar} alt={commentAuthor?.displayName} />
                              <AvatarFallback>{commentAuthor?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="bg-gray-100 p-2 rounded-lg">
                                <div className="font-medium text-sm">{commentAuthor?.displayName || 'Unknown'}</div>
                                <div className="text-sm">{comment.content}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                <span>{formatRelativeTime(comment.createdAt)}</span>
                                
                                {(user?.id === comment.userId || user?.role === 'admin') && (
                                  <button 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-red-500 hover:underline"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.displayName} />
                      <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Viết bình luận..."
                        className="min-h-[40px] resize-none"
                        disabled={isSubmitting}
                      />
                      
                      <Button 
                        size="sm" 
                        className="h-auto" 
                        onClick={handleAddComment}
                        disabled={isSubmitting || !comment.trim()}
                      >
                        <Send size={16} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
