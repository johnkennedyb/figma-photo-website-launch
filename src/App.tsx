
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import OnboardingStep from "./pages/OnboardingStep";
import Dashboard from "./pages/Dashboard";
import Counselors from "./pages/Counselors";
import CounselorProfile from "./pages/CounselorProfile";
import Chat from "./pages/Chat";
import Sessions from "./pages/Sessions";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
import CounselorSettings from "./pages/CounselorSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Welcome />} />
          
          {/* Client routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding/:step" element={<ProtectedRoute userType="client"><OnboardingStep /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute userType="client"><Dashboard /></ProtectedRoute>} />
          <Route path="/counselors" element={<ProtectedRoute userType="client"><Counselors /></ProtectedRoute>} />
          <Route path="/counselor/:id" element={<ProtectedRoute userType="client"><CounselorProfile /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
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
          <Route path="/counselor-settings" element={<CounselorSettings />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
