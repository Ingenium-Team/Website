-- Achievements Table
CREATE TABLE achievements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  event_date DATE NOT NULL,
  category TEXT,
  display_order INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  image_url TEXT,
  registration_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Table
CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  album TEXT,
  featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site Settings Table
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  image_url TEXT,
  icon TEXT,
  category TEXT,
  status TEXT,
  progress INTEGER DEFAULT 0,
  github_url TEXT,
  demo_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  visible BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access (authenticated users)
CREATE POLICY "authenticated users can manage achievements" 
  ON achievements 
  FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can manage events" 
  ON events 
  FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can manage gallery" 
  ON gallery 
  FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can manage projects" 
  ON projects 
  FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can manage site settings" 
  ON site_settings 
  FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for public read access
CREATE POLICY "anyone can view achievements" 
  ON achievements 
  FOR SELECT 
  USING (TRUE);

CREATE POLICY "anyone can view events" 
  ON events 
  FOR SELECT 
  USING (TRUE);

CREATE POLICY "anyone can view gallery" 
  ON gallery 
  FOR SELECT 
  USING (TRUE);

CREATE POLICY "anyone can view projects" 
  ON projects 
  FOR SELECT 
  USING (TRUE);

CREATE POLICY "anyone can view site settings" 
  ON site_settings 
  FOR SELECT 
  USING (TRUE);

-- Create indexes for performance
CREATE INDEX idx_achievements_featured ON achievements(featured);
CREATE INDEX idx_achievements_display_order ON achievements(display_order);
CREATE INDEX idx_events_featured ON events(featured);
CREATE INDEX idx_events_display_order ON events(display_order);
CREATE INDEX idx_gallery_featured ON gallery(featured);
CREATE INDEX idx_gallery_display_order ON gallery(display_order);
CREATE INDEX idx_projects_featured ON projects(featured);
CREATE INDEX idx_projects_visible ON projects(visible);
CREATE INDEX idx_projects_display_order ON projects(display_order);
CREATE INDEX idx_site_settings_key ON site_settings(key);
