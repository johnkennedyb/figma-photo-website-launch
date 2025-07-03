-- Create enum types
CREATE TYPE public.user_type AS ENUM ('client', 'counselor', 'admin');
CREATE TYPE public.marital_status AS ENUM ('single', 'married', 'divorced', 'widowed', 'separated');
CREATE TYPE public.counseling_type AS ENUM ('marital', 'premarital', 'mental_health', 'other');
CREATE TYPE public.language AS ENUM ('english', 'yoruba', 'igbo', 'hausa');
CREATE TYPE public.session_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.message_type AS ENUM ('text', 'file', 'system');
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'declined');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  user_type public.user_type NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  country_of_residence TEXT,
  city_of_residence TEXT,
  marital_status public.marital_status,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client onboarding data
CREATE TABLE public.client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  counseling_types public.counseling_type[],
  other_counseling_type TEXT,
  languages public.language[],
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Counselor qualifications and experience
CREATE TABLE public.counselor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  academic_qualifications TEXT,
  relevant_positions TEXT,
  years_of_experience INTEGER,
  issues_specialization TEXT,
  affiliations TEXT,
  languages public.language[],
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessions/appointments
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  counselor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status public.session_status DEFAULT 'pending',
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  counselor_id UUID NOT NULL,
  session_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type public.message_type DEFAULT 'text',
  file_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Counselor requests from clients
CREATE TABLE public.counselor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  counselor_id UUID NOT NULL,
  message TEXT,
  preferred_date TIMESTAMP WITH TIME ZONE,
  status public.request_status DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wallet/payments for counselors
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID NOT NULL,
  session_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earning', 'withdrawal', 'refund'
  description TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin logs
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.client_onboarding ADD CONSTRAINT client_onboarding_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.counselor_profiles ADD CONSTRAINT counselor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_counselor_id_fkey FOREIGN KEY (counselor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_counselor_id_fkey FOREIGN KEY (counselor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.counselor_requests ADD CONSTRAINT counselor_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.counselor_requests ADD CONSTRAINT counselor_requests_counselor_id_fkey FOREIGN KEY (counselor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_counselor_id_fkey FOREIGN KEY (counselor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
ALTER TABLE public.admin_logs ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Counselor profiles are viewable by everyone" ON public.profiles FOR SELECT USING (user_type = 'counselor');

-- RLS Policies for client onboarding
CREATE POLICY "Users can manage their own onboarding" ON public.client_onboarding FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for counselor profiles
CREATE POLICY "Counselors can manage their own profile" ON public.counselor_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Counselor profiles are viewable by everyone" ON public.counselor_profiles FOR SELECT USING (true);

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions" ON public.sessions FOR SELECT USING (auth.uid() = client_id OR auth.uid() = counselor_id);
CREATE POLICY "Clients can create sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Counselors can update sessions" ON public.sessions FOR UPDATE USING (auth.uid() = counselor_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = client_id OR auth.uid() = counselor_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = counselor_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.client_id = auth.uid() OR conversations.counselor_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.client_id = auth.uid() OR conversations.counselor_id = auth.uid())
  )
);

-- RLS Policies for counselor requests
CREATE POLICY "Users can view their own requests" ON public.counselor_requests FOR SELECT USING (auth.uid() = client_id OR auth.uid() = counselor_id);
CREATE POLICY "Clients can create requests" ON public.counselor_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Counselors can update requests" ON public.counselor_requests FOR UPDATE USING (auth.uid() = counselor_id);

-- RLS Policies for wallet transactions
CREATE POLICY "Counselors can view their own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = counselor_id);
CREATE POLICY "System can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

-- RLS Policies for admin logs (admin only)
CREATE POLICY "Admins can view all logs" ON public.admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'admin')
);
CREATE POLICY "Admins can create logs" ON public.admin_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'admin')
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX idx_sessions_client_id ON public.sessions(client_id);
CREATE INDEX idx_sessions_counselor_id ON public.sessions(counselor_id);
CREATE INDEX idx_sessions_scheduled_at ON public.sessions(scheduled_at);
CREATE INDEX idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX idx_conversations_counselor_id ON public.conversations(counselor_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_counselor_requests_client_id ON public.counselor_requests(client_id);
CREATE INDEX idx_counselor_requests_counselor_id ON public.counselor_requests(counselor_id);
CREATE INDEX idx_wallet_transactions_counselor_id ON public.wallet_transactions(counselor_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_onboarding_updated_at BEFORE UPDATE ON public.client_onboarding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_counselor_profiles_updated_at BEFORE UPDATE ON public.counselor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();