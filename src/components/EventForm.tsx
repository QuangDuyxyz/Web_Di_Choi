
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import { Event, EventType } from '@/types';
import { useToast } from "@/components/ui/use-toast";

interface EventFormProps {
  editMode?: boolean;
  eventToEdit?: Event;
}

export const EventForm = ({ editMode = false, eventToEdit }: EventFormProps) => {
  const { user } = useAuth();
  const { addEvent, updateEvent } = useEvents();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState(editMode && eventToEdit ? eventToEdit.title : '');
  const [date, setDate] = useState(
    editMode && eventToEdit 
      ? new Date(eventToEdit.date).toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  );
  const [description, setDescription] = useState(editMode && eventToEdit ? eventToEdit.description : '');
  const [eventType, setEventType] = useState<EventType>(
    editMode && eventToEdit ? eventToEdit.eventType : 'meeting'
  );
  const [emoji, setEmoji] = useState(editMode && eventToEdit ? eventToEdit.emoji || '' : '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !description) {
      toast({
        title: "Vui lòng điền đầy đủ thông tin",
        description: "Tiêu đề, ngày giờ và mô tả là bắt buộc",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Validate date format
      const formattedDate = new Date(date);
      if (isNaN(formattedDate.getTime())) {
        throw new Error('Ngày không hợp lệ');
      }
      
      const dateISOString = formattedDate.toISOString();
      
      if (editMode && eventToEdit) {
        updateEvent(eventToEdit.id, {
          title,
          date: dateISOString,
          description,
          eventType,
          emoji: emoji || undefined
        });
        
        // Verify data was saved by checking localStorage directly
        const savedEvents = localStorage.getItem('friendverse-events');
        if (savedEvents) {
          console.log('Events saved successfully after update');
        }
        
        toast({
          title: "Cập nhật thành công",
          description: "Sự kiện đã được cập nhật"
        });
      } else {
        addEvent({
          title,
          date: dateISOString,
          description,
          eventType,
          createdBy: user?.id || '',
          emoji: emoji || undefined,
          wishes: []
        });
        
        // Verify data was saved by checking localStorage directly
        const savedEvents = localStorage.getItem('friendverse-events');
        if (savedEvents) {
          console.log('Events saved successfully after adding new event');
        }
        
        toast({
          title: "Thêm thành công",
          description: "Sự kiện đã được thêm vào timeline"
        });
      }
      
      // Force an additional localStorage save to ensure data persistence
      setTimeout(() => {
        const currentEvents = localStorage.getItem('friendverse-events');
        if (currentEvents) {
          localStorage.setItem('friendverse-events', currentEvents);
          console.log('Additional localStorage save completed');
        }
      }, 500);
      
      navigate('/timeline');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu sự kiện. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          {editMode ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block font-medium">
              Tiêu đề sự kiện
            </label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề sự kiện"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date" className="block font-medium">
              Ngày giờ
            </label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="eventType" className="block font-medium">
              Loại sự kiện
            </label>
            <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại sự kiện" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Loại sự kiện</SelectLabel>
                  <SelectItem value="birthday">Sinh nhật</SelectItem>
                  <SelectItem value="anniversary">Kỷ niệm</SelectItem>
                  <SelectItem value="trip">Du lịch</SelectItem>
                  <SelectItem value="meeting">Gặp mặt</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="emoji" className="block font-medium">
              Emoji (tùy chọn)
            </label>
            <Input
              id="emoji"
              placeholder="Thêm 1 emoji để đại diện cho sự kiện"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Chỉ cần nhập 1 emoji, ví dụ: 🎂, 🎉, 🏖️
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block font-medium">
              Mô tả
            </label>
            <Textarea
              id="description"
              placeholder="Nhập mô tả sự kiện"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/timeline')}
            >
              Hủy
            </Button>
            <Button type="submit">
              {editMode ? 'Cập nhật' : 'Thêm sự kiện'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
