-- Migration: Create CMS Tables for Events, News, Announcements, and Banners
-- Created: 2026-04-06

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: cms_events
-- Stores upcoming events for the intranet
CREATE TABLE IF NOT EXISTS cms_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  category VARCHAR(100) DEFAULT 'general',
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table: cms_news
-- Stores news articles for the intranet
CREATE TABLE IF NOT EXISTS cms_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table: cms_announcements
-- Stores announcements for specific audiences
CREATE TABLE IF NOT EXISTS cms_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'normal',
  target_audience VARCHAR(100) DEFAULT 'all',
  is_published BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table: cms_banners
-- Stores hero banners for the dashboard
CREATE TABLE IF NOT EXISTS cms_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  background_color VARCHAR(7) DEFAULT '#1976D2',
  text_color VARCHAR(7) DEFAULT '#FFFFFF',
  cta_text VARCHAR(100),
  cta_link VARCHAR(500),
  is_active BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_cms_events_start_date ON cms_events(start_date);
CREATE INDEX idx_cms_events_is_published ON cms_events(is_published);
CREATE INDEX idx_cms_events_position ON cms_events(position);
CREATE INDEX idx_cms_news_published_at ON cms_news(published_at);
CREATE INDEX idx_cms_news_is_published ON cms_news(is_published);
CREATE INDEX idx_cms_news_is_featured ON cms_news(is_featured);
CREATE INDEX idx_cms_news_position ON cms_news(position);
CREATE INDEX idx_cms_announcements_is_published ON cms_announcements(is_published);
CREATE INDEX idx_cms_announcements_position ON cms_announcements(position);
CREATE INDEX idx_cms_banners_is_active ON cms_banners(is_active);
CREATE INDEX idx_cms_banners_position ON cms_banners(position);

-- Enable RLS (Row Level Security)
ALTER TABLE cms_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_banners ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access to published events
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON cms_events;
CREATE POLICY "Published events are viewable by everyone"
  ON cms_events FOR SELECT
  USING (is_published = TRUE);

-- Policy: Admin read/write access to all events
DROP POLICY IF EXISTS "Admins can manage all events" ON cms_events;
CREATE POLICY "Admins can manage all events"
  ON cms_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Public read access to published news
DROP POLICY IF EXISTS "Published news are viewable by everyone" ON cms_news;
CREATE POLICY "Published news are viewable by everyone"
  ON cms_news FOR SELECT
  USING (is_published = TRUE);

-- Policy: Admin read/write access to all news
DROP POLICY IF EXISTS "Admins can manage all news" ON cms_news;
CREATE POLICY "Admins can manage all news"
  ON cms_news FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Public read access to published announcements
DROP POLICY IF EXISTS "Published announcements are viewable by everyone" ON cms_announcements;
CREATE POLICY "Published announcements are viewable by everyone"
  ON cms_announcements FOR SELECT
  USING (is_published = TRUE);

-- Policy: Admin read/write access to all announcements
DROP POLICY IF EXISTS "Admins can manage all announcements" ON cms_announcements;
CREATE POLICY "Admins can manage all announcements"
  ON cms_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Public read access to active banners
DROP POLICY IF EXISTS "Active banners are viewable by everyone" ON cms_banners;
CREATE POLICY "Active banners are viewable by everyone"
  ON cms_banners FOR SELECT
  USING (is_active = TRUE);

-- Policy: Admin read/write access to all banners
DROP POLICY IF EXISTS "Admins can manage all banners" ON cms_banners;
CREATE POLICY "Admins can manage all banners"
  ON cms_banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_events_timestamp BEFORE UPDATE ON cms_events
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_cms_news_timestamp BEFORE UPDATE ON cms_news
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_cms_announcements_timestamp BEFORE UPDATE ON cms_announcements
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_cms_banners_timestamp BEFORE UPDATE ON cms_banners
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
