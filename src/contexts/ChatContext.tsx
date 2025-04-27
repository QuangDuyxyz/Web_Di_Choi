import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ChatGroup, ChatMessage, User } from '@/types';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

interface ChatContextType {
  chatGroups: ChatGroup[];
  messages: Record<string, ChatMessage[]>; // groupId -> messages
  createChatGroup: (name: string, description: string, members: string[]) => Promise<ChatGroup>;
  sendMessage: (groupId: string, content: string) => Promise<void>;
  joinChatGroup: (groupId: string, userId: string) => Promise<void>;
  leaveChatGroup: (groupId: string, userId: string) => Promise<void>;
  addMembersToChatGroup: (groupId: string, memberIds: string[]) => Promise<void>;
  getChatGroupById: (groupId: string) => ChatGroup | undefined;
  getChatGroupsByUserId: (userId: string) => ChatGroup[];
  getMessagesByGroupId: (groupId: string) => ChatMessage[];
  markMessagesAsRead: (groupId: string, userId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Load chat data from localStorage on mount
  useEffect(() => {
    const loadChatData = () => {
      try {
        const storedGroups = localStorage.getItem('chatGroups');
        const storedMessages = localStorage.getItem('chatMessages');
        
        if (storedGroups) {
          setChatGroups(JSON.parse(storedGroups));
        }
        
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      }
    };
    
    loadChatData();
  }, []);

  // Save chat data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatGroups', JSON.stringify(chatGroups));
  }, [chatGroups]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const createChatGroup = async (name: string, description: string, members: string[]): Promise<ChatGroup> => {
    if (!user) {
      throw new Error('User must be authenticated to create a chat group');
    }
    
    // Create a new chat group
    const newGroup: ChatGroup = {
      id: uuidv4(),
      name,
      description,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      members: [...members, user.id], // Add creator to members
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };
    
    // Update state
    setChatGroups(prev => [...prev, newGroup]);
    setMessages(prev => ({ ...prev, [newGroup.id]: [] }));
    
    toast({
      title: "Nhóm chat mới",
      description: `Nhóm "${name}" đã được tạo thành công.`,
    });
    
    return newGroup;
  };

  const sendMessage = async (groupId: string, content: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to send a message');
    }
    
    const group = chatGroups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Chat group not found');
    }
    
    // Check if user is a member of the group
    if (!group.members.includes(user.id)) {
      throw new Error('You are not a member of this chat group');
    }
    
    // Create a new message
    const newMessage: ChatMessage = {
      id: uuidv4(),
      groupId,
      senderId: user.id,
      content,
      timestamp: new Date().toISOString(),
      readBy: [user.id], // Sender has read the message
    };
    
    // Update state
    setMessages(prev => {
      const groupMessages = prev[groupId] || [];
      return {
        ...prev,
        [groupId]: [...groupMessages, newMessage],
      };
    });
  };

  const joinChatGroup = async (groupId: string, userId: string): Promise<void> => {
    const groupIndex = chatGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      throw new Error('Chat group not found');
    }
    
    // Check if user is already a member
    if (chatGroups[groupIndex].members.includes(userId)) {
      return; // User is already a member, do nothing
    }
    
    // Add user to members
    setChatGroups(prev => {
      const updatedGroups = [...prev];
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        members: [...updatedGroups[groupIndex].members, userId],
      };
      return updatedGroups;
    });
    
    toast({
      title: "Tham gia nhóm",
      description: `Bạn đã tham gia nhóm "${chatGroups[groupIndex].name}".`,
    });
  };

  const leaveChatGroup = async (groupId: string, userId: string): Promise<void> => {
    const groupIndex = chatGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      throw new Error('Chat group not found');
    }
    
    // Check if user is a member
    if (!chatGroups[groupIndex].members.includes(userId)) {
      return; // User is not a member, do nothing
    }
    
    // Remove user from members
    const updatedGroup = { 
      ...chatGroups[groupIndex],
      members: chatGroups[groupIndex].members.filter(id => id !== userId)
    };
    
    // Update state
    setChatGroups(prev => [
      ...prev.slice(0, groupIndex),
      updatedGroup,
      ...prev.slice(groupIndex + 1)
    ]);
    
    toast({
      title: "Rời nhóm chat",
      description: `Bạn đã rời khỏi nhóm "${updatedGroup.name}"`,
    });
  };

  const addMembersToChatGroup = async (groupId: string, memberIds: string[]): Promise<void> => {
    const groupIndex = chatGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      throw new Error('Chat group not found');
    }
    
    // Lấy danh sách thành viên hiện tại
    const currentMembers = chatGroups[groupIndex].members;
    
    // Lọc ra các thành viên chưa có trong nhóm
    const newMembers = memberIds.filter(id => !currentMembers.includes(id));
    
    if (newMembers.length === 0) {
      toast({
        title: "Thông báo",
        description: "Tất cả thành viên đã có trong nhóm",
      });
      return;
    }
    
    // Thêm thành viên mới vào nhóm
    const updatedGroup = { 
      ...chatGroups[groupIndex],
      members: [...currentMembers, ...newMembers]
    };
    
    // Cập nhật state
    setChatGroups(prev => [
      ...prev.slice(0, groupIndex),
      updatedGroup,
      ...prev.slice(groupIndex + 1)
    ]);
    
    toast({
      title: "Thêm thành viên",
      description: `Đã thêm ${newMembers.length} thành viên vào nhóm "${updatedGroup.name}"`
    });
  };

  const getChatGroupById = (groupId: string): ChatGroup | undefined => {
    return chatGroups.find(g => g.id === groupId);
  };

  const getChatGroupsByUserId = (userId: string): ChatGroup[] => {
    return chatGroups.filter(g => g.members.includes(userId));
  };

  const getMessagesByGroupId = (groupId: string): ChatMessage[] => {
    return messages[groupId] || [];
  };

  const markMessagesAsRead = async (groupId: string, userId: string): Promise<void> => {
    if (!messages[groupId]) {
      return; // No messages for this group
    }
    
    // Mark all messages as read by the user
    setMessages(prev => {
      const updatedMessages = prev[groupId].map(msg => {
        if (!msg.readBy.includes(userId)) {
          return {
            ...msg,
            readBy: [...msg.readBy, userId],
          };
        }
        return msg;
      });
      
      return {
        ...prev,
        [groupId]: updatedMessages,
      };
    });
  };

  return (
    <ChatContext.Provider
      value={{
        chatGroups,
        messages,
        createChatGroup,
        sendMessage,
        joinChatGroup,
        leaveChatGroup,
        addMembersToChatGroup,
        getChatGroupById,
        getChatGroupsByUserId,
        getMessagesByGroupId,
        markMessagesAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
