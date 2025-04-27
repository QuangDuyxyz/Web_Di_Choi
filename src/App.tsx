import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, PublicOnlyRoute } from "@/components/RouteGuards";
import { AuthProvider } from "@/contexts/AuthContext";
import { EventsProvider } from "@/contexts/EventsContext";
import { BirthdayProvider } from "@/contexts/BirthdayContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { PostProvider } from "@/contexts/PostContext";
import { DataSyncProvider } from "@/contexts/DataSyncContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Timeline from "./pages/Timeline";
import Members from "./pages/Members";
import Profile from "./pages/Profile";
import AddEvent from "./pages/AddEvent";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import DataSync from "./pages/DataSync";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <EventsProvider>
          <BirthdayProvider>
            <ChatProvider>
              <PostProvider>
                <DataSyncProvider>
                  <BrowserRouter>
                <Routes>
                  {/* Trang chủ công khai, tất cả đều có thể truy cập */}
                  <Route path="/" element={<Index />} />
                  
                  {/* Routes chỉ dành cho người dùng chưa đăng nhập */}
                  <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                  </Route>
                  
                  {/* Routes yêu cầu đăng nhập */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/timeline" element={<Timeline />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/add-event" element={<AddEvent />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/chat/:groupId" element={<Chat />} />
                  </Route>
                  
                  {/* Trang không tìm thấy */}
                  <Route path="*" element={<NotFound />} />
                  <Route path="/data-sync" element={<DataSync />} />
                </Routes>
                </BrowserRouter>
                </DataSyncProvider>
              </PostProvider>
            </ChatProvider>
          </BirthdayProvider>
        </EventsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
