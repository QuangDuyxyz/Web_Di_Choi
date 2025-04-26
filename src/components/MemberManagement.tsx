
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types";
import { Edit, Trash2 } from "lucide-react";

interface MemberManagementProps {
  members: User[];
  onUpdate: (user: User) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}

export const MemberManagement = ({ members, onUpdate, onDelete }: MemberManagementProps) => {
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      await onUpdate(editingMember);
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin thành viên đã được cập nhật"
      });
      setEditingMember(null);
    } catch (error) {
      toast({
        title: "Lỗi cập nhật",
        description: "Không thể cập nhật thông tin thành viên",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setIsDeleting(userId);
      await onDelete(userId);
      toast({
        title: "Xóa thành công",
        description: "Đã xóa thành viên khỏi hệ thống"
      });
    } catch (error) {
      toast({
        title: "Lỗi xóa",
        description: "Không thể xóa thành viên",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-start justify-between">
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
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingMember(member)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(member.id)}
                  disabled={isDeleting === member.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin thành viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho {editingMember?.displayName}
            </DialogDescription>
          </DialogHeader>
          
          {editingMember && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Tên hiển thị</Label>
                <Input
                  id="displayName"
                  value={editingMember.displayName}
                  onChange={(e) =>
                    setEditingMember(prev => 
                      prev ? { ...prev, displayName: e.target.value } : null
                    )
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  value={editingMember.username}
                  onChange={(e) =>
                    setEditingMember(prev => 
                      prev ? { ...prev, username: e.target.value } : null
                    )
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthdate">Ngày sinh</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={typeof editingMember.birthdate === 'string' 
                    ? editingMember.birthdate.split('T')[0]
                    : new Date(editingMember.birthdate).toISOString().split('T')[0]
                  }
                  onChange={(e) =>
                    setEditingMember(prev => 
                      prev ? { ...prev, birthdate: e.target.value } : null
                    )
                  }
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingMember(null)}>
                  Hủy
                </Button>
                <Button type="submit">Lưu thay đổi</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

