import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useEffect } from 'react';
import { subscribeToPushNotifications } from './lib/push-notifications';

// Import general pages
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";

// Import client pages
import OnboardingStep from "./pages/OnboardingStep";
import Dashboard from "./pages/Dashboard";
import Counselors from './pages/Counselors';
import VerifyPayment from './pages/VerifyPayment';
import CounselorProfile from "./pages/CounselorProfile";
import Chat from './pages/Chat';
import MessagesPage from './pages/Messages';
import Sessions from "./pages/Sessions";
import Booking from "./pages/Booking";
import BookingSuccess from "./pages/BookingSuccess";
import BookingCancel from "./pages/BookingCancel";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import RequestSession from "./pages/RequestSession";
import SessionsCalendar from "./pages/SessionsCalendar";

// Import counselor pages
import CounselorLogin from "./pages/CounselorLogin";
import CounselorSignUp from "./pages/CounselorSignUp";
import CounselorVerifyEmail from "./pages/CounselorVerifyEmail";
import CounselorOnboarding from "./pages/CounselorOnboarding";
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
import SessionManagement from './pages/admin/SessionManagement';
import ComplaintsManagement from './pages/admin/ComplaintsManagement';
import CounselorManagement from './pages/admin/CounselorManagement';
import AdminSettings from './pages/admin/Settings';
import Communications from './pages/admin/Communications';
import AdminSessions from "./pages/AdminSessions";
import AdminTransactions from './pages/AdminTransactions';
import AdminUsers from "./pages/AdminUsers";
import AdminRoute from "./components/AdminRoute";
import CounselorRoute from "./components/CounselorRoute";
import GlobalCallHandler from "./components/GlobalCallHandler";

const queryClient = new QueryClient();

const AppBody = () => {
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      subscribeToPushNotifications(token);
    }
  }, [user, token]);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
        <Route path="/payment/verify" element={<VerifyPayment />} />
        <Route path="/counselor/:id" element={<CounselorProfile />} />
        <Route path="/request-session/:id" element={<RequestSession />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/booking/cancel" element={<BookingCancel />} />
        <Route path="/sessions-calendar" element={<SessionsCalendar />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Counselor routes */}
        <Route path="/counselor-login" element={<CounselorLogin />} />
        <Route path="/counselor-signup" element={<CounselorSignUp />} />
        <Route path="/counselor-verify-email" element={<CounselorVerifyEmail />} />
        <Route path="/counselor-onboarding/:step" element={<CounselorOnboarding />} />
        
        {/* Protected Counselor Routes */}
        <Route path="/counselor" element={<CounselorRoute />}>
          <Route path="dashboard" element={<CounselorDashboard />} />
          <Route path="requests" element={<CounselorRequests />} />
          <Route path="wallet" element={<CounselorWallet />} />
          <Route path="sessions" element={<CounselorSessions />} />
          <Route path="chat/:id" element={<CounselorChat />} />
          <Route path="messages" element={<CounselorMessages />} />
          <Route path="settings" element={<CounselorSettings />} />
          <Route path="client-profile/:clientId" element={<ClientProfile />} />
          <Route path="profile/edit" element={<EditCounselorProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="sessions" element={<SessionManagement />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="complaints" element={<ComplaintsManagement />} />
          <Route path="counselors" element={<CounselorManagement />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="communications" element={<Communications />} />
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppBody />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
