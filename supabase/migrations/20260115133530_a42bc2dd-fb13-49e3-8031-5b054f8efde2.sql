-- Add type, niche, and notes columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS niche text,
ADD COLUMN IF NOT EXISTS notes text;