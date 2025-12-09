-- Add year_founded column to startups table
ALTER TABLE public.startups 
ADD COLUMN year_founded INTEGER;