import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Camera, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
  user: User;
  onAvatarUpdate: (avatarUrl: string) => Promise<void>;
}

export const AvatarUpload = ({ user, onAvatarUpdate }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một tệp hình ảnh.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      // Tạo URL xem trước
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Trong môi trường thực tế, bạn sẽ tải ảnh lên server hoặc dịch vụ lưu trữ
      // Ở đây, chúng ta sẽ sử dụng FileReader để chuyển đổi ảnh thành base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Gọi hàm cập nhật avatar
        await onAvatarUpdate(base64);
        
        toast({
          title: "Cập nhật thành công",
          description: "Ảnh đại diện của bạn đã được cập nhật."
        });
        
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi đọc file.",
          variant: "destructive"
        });
        setIsUploading(false);
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải ảnh lên.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const avatarUrl = previewUrl || user.avatar;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="w-32 h-32 border-2 border-primary">
          <AvatarImage src={avatarUrl} alt={user.displayName} />
          <AvatarFallback className="text-2xl">{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <Button 
          size="icon" 
          className="absolute bottom-0 right-0 rounded-full w-8 h-8"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <Button 
        variant="outline" 
        onClick={handleUploadClick}
        disabled={isUploading}
        className="mt-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Cập nhật ảnh đại diện
          </>
        )}
      </Button>
    </div>
  );
};
