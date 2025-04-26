import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EventsProvider } from "@/contexts/EventsContext";
import { BirthdayProvider } from "@/contexts/BirthdayContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Timeline from "./pages/Timeline";
import Members from "./pages/Members";
import Profile from "./pages/Profile";
import AddEvent from "./pages/AddEvent";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <EventsProvider>
          <BirthdayProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/members" element={<Members />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/add-event" element={<AddEvent />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </BirthdayProvider>
        </EventsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
