-- HospitALL Initial Database Schema
-- This migration creates all tables needed for the HospitALL application

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'patient');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triage sessions (replaces in-memory Map)
CREATE TABLE public.triage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes'
);

-- Conversation logs (PHI-stripped)
CREATE TABLE public.conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  thread_id TEXT,
  intent TEXT,
  sanitized_message TEXT NOT NULL,
  response_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage metrics
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost_cents NUMERIC(10,4) DEFAULT 0,
  latency_ms INTEGER,
  model_used TEXT,
  endpoint TEXT NOT NULL,
  intent TEXT,
  external_llm_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  conversation_log_id UUID REFERENCES public.conversation_logs(id),
  rating INTEGER CHECK (rating IN (-1, 1)),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  endpoint TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  request_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin settings
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_triage_sessions_session_id ON public.triage_sessions(session_id);
CREATE INDEX idx_triage_sessions_expires ON public.triage_sessions(expires_at);
CREATE INDEX idx_conversation_logs_user ON public.conversation_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_metrics_user ON public.usage_metrics(user_id, created_at DESC);
CREATE INDEX idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX idx_knowledge_base_status ON public.knowledge_base(status);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users see own data

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Triage sessions policies
CREATE POLICY "Users view own triage sessions" ON public.triage_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own triage sessions" ON public.triage_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Conversation logs policies
CREATE POLICY "Users view own conversations" ON public.conversation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own conversations" ON public.conversation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage metrics policies
CREATE POLICY "Users view own metrics" ON public.usage_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own metrics" ON public.usage_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Error logs policies
CREATE POLICY "Users view own errors" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own errors" ON public.error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin settings - only admins can view/modify
CREATE POLICY "Admins manage settings" ON public.admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Knowledge base - everyone can read active, admins can modify
CREATE POLICY "Anyone can view active knowledge base" ON public.knowledge_base
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins manage knowledge base" ON public.knowledge_base
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Service role bypass policies (for server-side operations)
-- These allow the service role to bypass RLS for logging and session management
CREATE POLICY "Service role full access on conversation_logs" ON public.conversation_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on usage_metrics" ON public.usage_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on triage_sessions" ON public.triage_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on error_logs" ON public.error_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on profiles" ON public.profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_triage_sessions_updated_at
  BEFORE UPDATE ON public.triage_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
