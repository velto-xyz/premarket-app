-- Add founders column to startups table
ALTER TABLE public.startups 
ADD COLUMN founders TEXT;