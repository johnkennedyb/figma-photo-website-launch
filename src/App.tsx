import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Import general pages
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";

// Import client pages
import OnboardingStep from "./pages/OnboardingStep";
import Dashboard from "./pages/Dashboard";
import Counselors from "./pages/Counselors";
import CounselorProfile from "./pages/CounselorProfile";
import Chat from './pages/Chat';
import MessagesPage from './pages/Messages';
import Sessions from "./pages/Sessions";
import Booking from "./pages/Booking";
import BookingSuccess from "./pages/BookingSuccess";
import BookingCancel from "./pages/BookingCancel";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

// Import counselor pages
import CounselorLogin from "./pages/CounselorLogin";
import CounselorSignUp from "./pages/CounselorSignUp";
import CounselorVerifyEmail from "./pages/CounselorVerifyEmail";
import CounselorOnboardingStep from "./pages/CounselorOnboardingStep";
import CounselorDashboard from "./pages/CounselorDashboard";
import CounselorRequests from "./pages/CounselorRequests";
import CounselorWallet from "./pages/CounselorWallet";
import CounselorSessions from "./pages/CounselorSessions";
import CounselorChat from "./pages/CounselorChat";
import CounselorMessages from './pages/CounselorMessages';
import CounselorSettings from "./pages/CounselorSettings";
import EditCounselorProfile from './pages/EditCounselorProfile';
import ClientProfile from "./pages/ClientProfile";

// Import admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from './pages/AdminDashboard';
import ClientManagement from './pages/admin/ClientManagement';
import SessionManagement from './pages/admin/SessionManagement';
import ComplaintsManagement from './pages/admin/ComplaintsManagement';
import AdminSessions from "./pages/AdminSessions";
import AdminTransactionList from './pages/AdminTransactionList';
import AdminUsers from "./pages/AdminUsers";
import AdminRoute from "./components/AdminRoute";
import GlobalCallHandler from "./components/GlobalCallHandler";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalCallHandler />
          <Routes>
            <Route path="/" element={<Welcome />} />
            
            {/* Client routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding/:step" element={<OnboardingStep />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/counselors" element={<Counselors />} />
            <Route path="/counselor/:id" element={<CounselorProfile />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/book/:counselorId" element={<Booking />} />
            <Route path="/booking/success" element={<BookingSuccess />} />
            <Route path="/booking/cancel" element={<BookingCancel />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Counselor routes */}
            <Route path="/counselor-login" element={<CounselorLogin />} />
            <Route path="/counselor-signup" element={<CounselorSignUp />} />
            <Route path="/counselor-verify-email" element={<CounselorVerifyEmail />} />
            <Route path="/counselor-onboarding/:step" element={<CounselorOnboardingStep />} />
            <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
            <Route path="/counselor-requests" element={<CounselorRequests />} />
            <Route path="/counselor-wallet" element={<CounselorWallet />} />
            <Route path="/counselor-sessions" element={<CounselorSessions />} />
            <Route path="/counselor-chat/:id" element={<CounselorChat />} />
            <Route path="/counselor-dashboard/messages" element={<CounselorMessages />} />
            <Route path="/counselor-settings" element={<CounselorSettings />} />
            <Route path="/counselor/client-profile/:clientId" element={<ClientProfile />} />
            <Route path="/counselor/profile/edit" element={<EditCounselorProfile />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="clients" element={<ClientManagement />} />
              <Route path="sessions" element={<SessionManagement />} />
              <Route path="users" element={<AdminUsers />} />

                            <Route path="transactions" element={<AdminTransactionList />} />
              <Route path="complaints" element={<ComplaintsManagement />} />
            </Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
