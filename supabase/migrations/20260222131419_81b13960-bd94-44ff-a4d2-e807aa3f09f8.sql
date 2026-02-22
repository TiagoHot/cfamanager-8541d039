ALTER TABLE public.weekly_results
  ADD COLUMN campaign_earnings_usd numeric DEFAULT 0,
  ADD COLUMN campaign_earnings_eur numeric DEFAULT 0;