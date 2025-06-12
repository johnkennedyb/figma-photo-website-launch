
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Counselor routes */}
          <Route path="/counselor-login" element={<CounselorLogin />} />
          <Route path="/counselor-signup" element={<CounselorSignUp />} />
          <Route path="/counselor-verify-email" element={<CounselorVerifyEmail />} />
          <Route path="/counselor-onboarding/:step" element={<CounselorOnboardingStep />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
