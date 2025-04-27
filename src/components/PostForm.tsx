import { useState, useRef, ChangeEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePost } from '@/contexts/PostContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostAttachment } from '@/types/post';
import { ImageIcon, VideoIcon, X, SendIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export const PostForm = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [attachmentPreview, setAttachmentPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { addPost } = usePost();
  const { toast } = useToast();

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Kiểm tra số lượng tệp đính kèm
      if (attachments.length + newFiles.length > 5) {
        toast({
          title: "Quá nhiều tệp đính kèm",
          description: "Chỉ có thể đính kèm tối đa 5 ảnh hoặc video",
          variant: "destructive"
        });
        return;
      }
      
      // Xử lý từng tệp
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && e.target.result) {
              const newImageUrl = e.target.result.toString();
              
              setAttachments(prev => [
                ...prev, 
                { 
                  id: uuidv4(), 
                  type: 'image', 
                  url: newImageUrl 
                }
              ]);
              
              setAttachmentPreview(prev => [...prev, newImageUrl]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleVideoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Kiểm tra số lượng tệp đính kèm
      if (attachments.length + newFiles.length > 5) {
        toast({
          title: "Quá nhiều tệp đính kèm",
          description: "Chỉ có thể đính kèm tối đa 5 ảnh hoặc video",
          variant: "destructive"
        });
        return;
      }
      
      // Xử lý từng tệp
      newFiles.forEach(file => {
        if (file.type.startsWith('video/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && e.target.result) {
              const newVideoUrl = e.target.result.toString();
              
              setAttachments(prev => [
                ...prev, 
                { 
                  id: uuidv4(), 
                  type: 'video', 
                  url: newVideoUrl 
                }
              ]);
              
              setAttachmentPreview(prev => [...prev, newVideoUrl]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    setAttachmentPreview(attachmentPreview.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung hoặc đính kèm ảnh/video",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addPost(content.trim(), attachments);
      if (result) {
        setContent('');
        setAttachments([]);
        setAttachmentPreview([]);
        
        toast({
          title: "Thành công",
          description: "Đã đăng bài viết mới",
        });
      }
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng bài viết",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.displayName} />
              <AvatarFallback>{user ? getInitials(user.displayName) : 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`${user?.displayName} ơi, bạn đang nghĩ gì?`}
                className="mb-3 resize-none min-h-[100px]"
              />
              
              {attachmentPreview.length > 0 && (
                <div className={cn(
                  "grid gap-2 mb-3", 
                  attachmentPreview.length === 1 ? "grid-cols-1" : 
                  attachmentPreview.length === 2 ? "grid-cols-2" : 
                  "grid-cols-3"
                )}>
                  {attachmentPreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      {attachments[index]?.type === 'image' ? (
                        <img 
                          src={preview} 
                          alt={`Attachment ${index + 1}`} 
                          className="h-[150px] w-full object-cover rounded-md"
                        />
                      ) : (
                        <video 
                          src={preview} 
                          className="h-[150px] w-full object-cover rounded-md"
                          controls
                        />
                      )}
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <ImageIcon size={16} className="mr-1" />
                    Ảnh
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={isSubmitting}
                  />
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <VideoIcon size={16} className="mr-1" />
                    Video
                  </Button>
                  <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/*"
                    multiple
                    onChange={handleVideoSelect}
                    disabled={isSubmitting}
                  />
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || (content.trim() === '' && attachments.length === 0)}
                >
                  <SendIcon size={16} className="mr-1" />
                  Đăng
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
