-- ============================================================================
-- Seed Industries
-- ============================================================================

INSERT INTO public.industries (name, slug, description, icon_name) VALUES
  ('Space', 'space', 'Space exploration and aerospace technology', 'Rocket'),
  ('FinTech', 'fintech', 'Financial Technology startups revolutionizing banking and payments', 'Wallet'),
  ('BioTech', 'biotech', 'Biotechnology companies advancing healthcare and medicine', 'Dna'),
  ('Robotics', 'robotics', 'Robotics companies building intelligent machines', 'Bot'),
  ('Automotive', 'automotive', 'Next-generation automotive and mobility solutions', 'Car'),
  ('IoT', 'iot', 'Internet of Things startups connecting the physical world', 'Wifi')
ON CONFLICT (slug) DO NOTHING;
