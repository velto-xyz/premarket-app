-- Create industries table
CREATE TABLE public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create startups table
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  description TEXT,
  logo_url TEXT,
  hq_location TEXT NOT NULL,
  hq_latitude DECIMAL(9,6),
  hq_longitude DECIMAL(9,6),
  current_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  market_cap DECIMAL(20,2),
  price_change_24h DECIMAL(5,2),
  unicorn_color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user positions table (for tracking user's long/short positions)
CREATE TABLE public.user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  position_type TEXT NOT NULL CHECK (position_type IN ('long', 'short')),
  entry_price DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(18,8) NOT NULL,
  leverage DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  liquidation_price DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for industries (public read)
CREATE POLICY "Industries are viewable by everyone"
  ON public.industries FOR SELECT
  USING (true);

-- RLS Policies for startups (public read)
CREATE POLICY "Startups are viewable by everyone"
  ON public.startups FOR SELECT
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_positions
CREATE POLICY "Users can view their own positions"
  ON public.user_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions"
  ON public.user_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
  ON public.user_positions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_startups_updated_at
  BEFORE UPDATE ON public.startups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_positions_updated_at
  BEFORE UPDATE ON public.user_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample industries
INSERT INTO public.industries (name, slug, description, icon_name) VALUES
  ('FinTech', 'fintech', 'Financial Technology startups revolutionizing banking and payments', 'Wallet'),
  ('BioTech', 'biotech', 'Biotechnology companies advancing healthcare and medicine', 'Dna'),
  ('IoT', 'iot', 'Internet of Things startups connecting the physical world', 'Wifi'),
  ('Robotics', 'robotics', 'Robotics companies building intelligent machines', 'Bot'),
  ('Space', 'space', 'Space exploration and aerospace technology', 'Rocket'),
  ('Automotive', 'automotive', 'Next-generation automotive and mobility solutions', 'Car');

-- Insert sample startups
INSERT INTO public.startups (name, slug, industry_id, description, hq_location, hq_latitude, hq_longitude, current_price, price_change_24h, unicorn_color) VALUES
  (
    'PayFlow',
    'payflow',
    (SELECT id FROM public.industries WHERE slug = 'fintech'),
    'Next-gen payment processing platform',
    'San Francisco, CA, USA',
    37.7749,
    -122.4194,
    142.50,
    12.5,
    '#8B5CF6'
  ),
  (
    'GeneMed',
    'genemed',
    (SELECT id FROM public.industries WHERE slug = 'biotech'),
    'Personalized medicine through genomics',
    'Boston, MA, USA',
    42.3601,
    -71.0589,
    89.30,
    -3.2,
    '#EC4899'
  ),
  (
    'SmartGrid',
    'smartgrid',
    (SELECT id FROM public.industries WHERE slug = 'iot'),
    'IoT solutions for smart cities',
    'Austin, TX, USA',
    30.2672,
    -97.7431,
    67.80,
    8.7,
    '#10B981'
  ),
  (
    'RoboTech',
    'robotech',
    (SELECT id FROM public.industries WHERE slug = 'robotics'),
    'Industrial automation robots',
    'Tokyo, Japan',
    35.6762,
    139.6503,
    234.20,
    5.4,
    '#F59E0B'
  ),
  (
    'OrbitLaunch',
    'orbitlaunch',
    (SELECT id FROM public.industries WHERE slug = 'space'),
    'Commercial satellite launch services',
    'Cape Canaveral, FL, USA',
    28.3922,
    -80.6077,
    512.00,
    15.8,
    '#3B82F6'
  ),
  (
    'AutoDrive',
    'autodrive',
    (SELECT id FROM public.industries WHERE slug = 'automotive'),
    'Autonomous vehicle technology',
    'Detroit, MI, USA',
    42.3314,
    -83.0458,
    178.90,
    -1.5,
    '#EF4444'
  );