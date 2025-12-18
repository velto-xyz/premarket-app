-- Seed Industries
INSERT INTO public.industries (name, slug, description, icon_name) VALUES
  ('Foundation', 'foundation', 'The "Brains" / LLM Builders', 'Brain'),
  ('Infra', 'infra', 'Chips, Cloud, Data, & DevTools', 'Cpu'),
  ('Creative', 'creative', 'Audio, Video, & Art generation', 'Palette'),
  ('Consumer', 'consumer', 'Search, Social, & Personal Assistants', 'Smartphone'),
  ('Enterprise', 'enterprise', 'B2B, Defense, Coding, & Legal', 'Briefcase'),
  ('Robotics', 'robotics', 'Physical AI & Humanoids', 'Bot')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name;
