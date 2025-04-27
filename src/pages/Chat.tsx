import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChatGroup, User } from '@/types';
import { PlusCircle, Send, Users, UserPlus, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { mockUsers } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const Chat = () => {
  const { isAuthenticated, user } = useAuth();
  const { 
    chatGroups, 
    messages, 
    createChatGroup, 
    sendMessage, 
    getChatGroupsByUserId,
    getMessagesByGroupId,
    markMessagesAsRead,
    addMembersToChatGroup
  } = useChat();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Set selected group based on URL param
  useEffect(() => {
    if (groupId) {
      const group = chatGroups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroup(group);
      }
    } else if (chatGroups.length > 0 && user) {
      // If no group is selected, select the first one the user is a member of
      const userGroups = getChatGroupsByUserId(user.id);
      if (userGroups.length > 0) {
        setSelectedGroup(userGroups[0]);
        navigate(`/chat/${userGroups[0].id}`);
      }
    }
  }, [groupId, chatGroups, user, navigate, getChatGroupsByUserId]);

  // Mark messages as read when a group is selected
  useEffect(() => {
    if (selectedGroup && user) {
      markMessagesAsRead(selectedGroup.id, user.id);
    }
  }, [selectedGroup, user, markMessagesAsRead]);

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedGroup) return;
    
    sendMessage(selectedGroup.id, messageContent.trim())
      .then(() => {
        setMessageContent('');
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    
    try {
      const newGroup = await createChatGroup(
        newGroupName.trim(),
        newGroupDescription.trim(),
        [] // Start with just the creator
      );
      
      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreateDialogOpen(false);
      
      // Navigate to the new group
      navigate(`/chat/${newGroup.id}`);
      
      toast({
        title: "Tạo nhóm thành công",
        description: `Nhóm "${newGroupName.trim()}" đã được tạo.`
      });
    } catch (error) {
      console.error('Error creating chat group:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo nhóm chat mới.",
        variant: "destructive"
      });
    }
  };
  
  // Hàm xử lý thêm thành viên vào nhóm chat
  const handleAddMembers = async () => {
    if (!selectedGroup || !user || selectedMembers.length === 0) return;
    
    try {
      await addMembersToChatGroup(selectedGroup.id, selectedMembers);
      
      setSelectedMembers([]);
      setIsAddMembersDialogOpen(false);
      
      toast({
        title: "Thêm thành viên thành công",
        description: `Đã thêm ${selectedMembers.length} thành viên vào nhóm "${selectedGroup.name}".`
      });
    } catch (error) {
      console.error('Error adding members to chat group:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm thành viên vào nhóm chat.",
        variant: "destructive"
      });
    }
  };
  
  // Hàm xử lý chọn/bỏ chọn thành viên
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const userGroups = user ? getChatGroupsByUserId(user.id) : [];
  const groupMessages = selectedGroup ? getMessagesByGroupId(selectedGroup.id) : [];

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Chat Groups */}
          <div className="w-full md:w-1/4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nhóm chat</h2>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tạo nhóm
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo nhóm chat mới</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Tên nhóm</Label>
                      <Input
                        id="group-name"
                        placeholder="Nhập tên nhóm..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="group-description">Mô tả (tùy chọn)</Label>
                      <Textarea
                        id="group-description"
                        placeholder="Nhập mô tả nhóm..."
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={handleCreateGroup}>Tạo nhóm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-2">
              {userGroups.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    <p>Bạn chưa tham gia nhóm chat nào.</p>
                    <p>Hãy tạo nhóm mới để bắt đầu trò chuyện!</p>
                  </CardContent>
                </Card>
              ) : (
                userGroups.map(group => (
                  <Card 
                    key={group.id}
                    className={`cursor-pointer transition-colors ${selectedGroup?.id === group.id ? 'bg-primary/10 border-primary' : ''}`}
                    onClick={() => navigate(`/chat/${group.id}`)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={group.avatar} alt={group.name} />
                        <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {group.description || `${group.members.length} thành viên`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1">
            {selectedGroup ? (
              <div className="flex flex-col h-[70vh] border rounded-lg">
                {/* Chat Header */}
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedGroup.avatar} alt={selectedGroup.name} />
                      <AvatarFallback>{selectedGroup.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">{selectedGroup.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedGroup.members.length} thành viên
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={isAddMembersDialogOpen} onOpenChange={setIsAddMembersDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Thêm thành viên">
                          <UserPlus className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Thêm thành viên vào nhóm</DialogTitle>
                          <DialogDescription>
                            Chọn thành viên bạn muốn thêm vào nhóm "{selectedGroup.name}"
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          <h4 className="mb-2 font-medium">Thành viên có sẵn:</h4>
                          <ScrollArea className="h-[300px] border rounded-md p-2">
                            <div className="space-y-2">
                              {/* Hiển thị danh sách thành viên từ mockUsers và registeredMockUsers */}
                              {[...mockUsers, ...(window.registeredMockUsers || [])]
                                // Lọc ra những người chưa có trong nhóm
                                .filter(member => !selectedGroup.members.includes(member.id))
                                // Loại bỏ trùng lặp
                                .filter((member, index, self) => 
                                  index === self.findIndex(m => m.id === member.id)
                                )
                                .map(member => (
                                  <div 
                                    key={member.id} 
                                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.avatar} alt={member.displayName} />
                                        <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{member.displayName}</p>
                                        <p className="text-xs text-muted-foreground">{member.username}</p>
                                      </div>
                                    </div>
                                    
                                    <Checkbox
                                      checked={selectedMembers.includes(member.id)}
                                      onCheckedChange={() => toggleMemberSelection(member.id)}
                                    />
                                  </div>
                                ))
                              }
                            </div>
                          </ScrollArea>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddMembersDialogOpen(false)}>Hủy</Button>
                          <Button onClick={handleAddMembers} disabled={selectedMembers.length === 0}>
                            Thêm ({selectedMembers.length})
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="icon" title="Xem thành viên">
                      <Users className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  {groupMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupMessages.map(message => {
                        const isCurrentUser = message.senderId === user.id;
                        
                        // Tìm thông tin người gửi
                        let sender = null;
                        
                        // Tìm trong mockUsers
                        sender = mockUsers.find(u => u.id === message.senderId);
                        
                        // Nếu không tìm thấy, tìm trong registeredMockUsers
                        if (!sender && window.registeredMockUsers) {
                          sender = window.registeredMockUsers.find(u => u.id === message.senderId);
                        }
                        
                        // Nếu là người dùng hiện tại
                        if (!sender && user && user.id === message.senderId) {
                          sender = user;
                        }
                        
                        return (
                          <motion.div 
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {!isCurrentUser && (
                              <Avatar className="h-8 w-8 mr-2 mt-1">
                                <AvatarImage src={sender?.avatar} alt={sender?.displayName} />
                                <AvatarFallback>{sender?.displayName?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={`max-w-[80%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                              {!isCurrentUser && (
                                <p className="text-xs font-medium mb-1">
                                  {sender?.displayName || 'Người dùng không xác định'}
                                </p>
                              )}
                              
                              <p className="break-words">{message.content}</p>
                              
                              <p className="text-xs mt-1 opacity-70">
                                {formatDistanceToNow(new Date(message.timestamp), { 
                                  addSuffix: true,
                                  locale: vi 
                                })}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                      {/* Tham chiếu đến phần cuối của danh sách tin nhắn để cuộn tự động */}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!messageContent.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="h-[70vh] flex items-center justify-center">
                <CardContent className="text-center p-6">
                  <h3 className="text-xl font-medium mb-2">Chưa có nhóm chat nào được chọn</h3>
                  <p className="text-muted-foreground mb-4">
                    Chọn một nhóm chat từ danh sách bên trái hoặc tạo một nhóm mới để bắt đầu.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tạo nhóm chat mới
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Chat;
