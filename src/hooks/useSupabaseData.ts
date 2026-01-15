import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product, CampaignResult, WeeklyResult, IncomeExpense } from '@/types';

// Helper to format dates to ISO format (YYYY-MM-DD)
function formatDateToISO(dateValue: string | Date | null | undefined): string | null {
  if (!dateValue) return null;
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export function useSupabaseData() {
  const { user } = useAuth();

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('product_number', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data.map((p) => ({
      id: p.id,
      date: p.date || '',
      productNumber: p.product_number,
      name: p.name,
      type: p.type || '', // Ensure type is mapped on fetch
      niche: p.niche || '', // Ensure niche is mapped on fetch
      platform: p.platform || '',
      country: p.country || 'Brasil',
      currency: p.currency || 'Real',
      averageTicket: p.average_ticket || 0,
      commissionPercent: p.commission_percent || 0,
      commissionBRL: p.commission_brl || 0,
      notes: p.notes || '', // Ensure notes is mapped on fetch
    }));
  }, [user]);

  const fetchCampaigns = useCallback(async (): Promise<CampaignResult[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('campaign_results')
      .select('*')
      .order('year', { ascending: false })
      .order('month_number', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }

    return data.map((c) => ({
      id: c.id,
      year: c.year,
      monthNumber: c.month_number,
      month: c.month,
      startDate: c.start_date || '',
      endDate: c.end_date || '',
      daysRunning: c.days_running || 0,
      productName: c.product_name,
      niche: c.niche || '', // Ensure niche is mapped on fetch
      location: c.location || '',
      strategy: c.strategy || '',
      commissionBRL: c.commission_brl || 0,
      impressions: c.impressions || 0,
      clicks: c.clicks || 0,
      sales: c.sales || 0,
      cpc: c.cpc || 0,
      earnings: c.earnings || 0,
      costs: c.costs || 0,
      profitLoss: c.profit_loss || 0,
      roi: c.roi || 0,
    }));
  }, [user]);

  const fetchWeeklyResults = useCallback(async (): Promise<WeeklyResult[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('weekly_results')
      .select('*')
      .order('year', { ascending: false })
      .order('week', { ascending: false });

    if (error) {
      console.error('Error fetching weekly results:', error);
      return [];
    }

    return data.map((w) => ({
      id: w.id,
      week: w.week,
      year: w.year,
      month: w.month,
      period: w.period || '',
      campaignCosts: w.campaign_costs || 0,
      sales: w.sales || 0,
      campaignEarnings: w.campaign_earnings || 0,
      organicEarnings: w.organic_earnings || 0,
      adsenseEarnings: w.adsense_earnings || 0,
      revenue: w.revenue || 0,
      profitLoss: w.profit_loss || 0,
    }));
  }, [user]);

  const fetchIncomeExpenses = useCallback(async (): Promise<IncomeExpense[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('income_expenses')
      .select('*')
      .order('year', { ascending: false })
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching income/expenses:', error);
      return [];
    }

    return data.map((i) => ({
      id: i.id,
      type: i.type as 'income' | 'expense',
      year: i.year,
      month: i.month,
      date: i.date,
      source: i.source || '',
      details: i.details || '',
      amount: i.amount,
    }));
  }, [user]);

  const saveProducts = useCallback(async (products: Product[]): Promise<boolean> => {
    if (!user) return false;

    // Delete existing products for this user first
    await supabase.from('products').delete().eq('user_id', user.id);

    if (products.length === 0) return true;

    const { error } = await supabase.from('products').insert(
      products.map((p) => ({
        user_id: user.id,
        product_number: p.productNumber,
        name: p.name,
        type: p.type || null, // Added type
        niche: p.niche || null, // Added niche
        date: formatDateToISO(p.date),
        platform: p.platform || null,
        country: p.country || 'Brasil',
        currency: p.currency || 'Real',
        average_ticket: p.averageTicket || null,
        commission_percent: p.commissionPercent || null,
        commission_brl: p.commissionBRL || null,
        notes: p.notes || null, // Added notes
      }))
    );

    if (error) {
      console.error('Error saving products:', error);
      return false;
    }
    return true;
  }, [user]);

  const saveCampaigns = useCallback(async (campaigns: CampaignResult[]): Promise<boolean> => {
    if (!user) return false;

    // Delete existing campaigns for this user
    await supabase.from('campaign_results').delete().eq('user_id', user.id);

    if (campaigns.length === 0) return true;

    const { error } = await supabase.from('campaign_results').insert(
      campaigns.map((c) => ({
        user_id: user.id,
        year: c.year,
        month_number: c.monthNumber,
        month: c.month,
        start_date: formatDateToISO(c.startDate),
        end_date: formatDateToISO(c.endDate),
        days_running: c.daysRunning ? Math.round(c.daysRunning) : null,
        product_name: c.productName,
        niche: c.niche || null, // Added niche
        location: c.location || null,
        strategy: c.strategy || null,
        commission_brl: c.commissionBRL || null,
        impressions: c.impressions ? Math.round(c.impressions) : null,
        clicks: c.clicks ? Math.round(c.clicks) : null,
        sales: c.sales ? Math.round(c.sales) : null,
        cpc: c.cpc || null,
        earnings: c.earnings || null,
        costs: c.costs || null,
        profit_loss: c.profitLoss || null,
        roi: c.roi || null,
      }))
    );

    if (error) {
      console.error('Error saving campaigns:', error);
      return false;
    }
    return true;
  }, [user]);

  const saveWeeklyResults = useCallback(async (results: WeeklyResult[]): Promise<boolean> => {
    if (!user) return false;

    // Delete existing weekly results for this user
    await supabase.from('weekly_results').delete().eq('user_id', user.id);

    if (results.length === 0) return true;

    const { error } = await supabase.from('weekly_results').insert(
      results.map((w) => ({
        user_id: user.id,
        week: w.week,
        year: w.year,
        month: w.month,
        period: w.period || null,
        campaign_costs: w.campaignCosts || null,
        sales: w.sales ? Math.round(w.sales) : null,
        campaign_earnings: w.campaignEarnings || null,
        organic_earnings: w.organicEarnings || null,
        adsense_earnings: w.adsenseEarnings || null,
        revenue: w.revenue || null,
        profit_loss: w.profitLoss || null,
      }))
    );

    if (error) {
      console.error('Error saving weekly results:', error);
      return false;
    }
    return true;
  }, [user]);

  const saveIncomeExpenses = useCallback(async (items: IncomeExpense[]): Promise<boolean> => {
    if (!user) return false;

    // Delete existing income/expenses for this user
    await supabase.from('income_expenses').delete().eq('user_id', user.id);

    if (items.length === 0) return true;

    const { error } = await supabase.from('income_expenses').insert(
      items.map((i) => ({
        user_id: user.id,
        type: i.type,
        year: i.year,
        month: i.month,
        date: formatDateToISO(i.date) || new Date().toISOString().split('T')[0],
        source: i.source || null,
        details: i.details || null,
        amount: i.amount,
      }))
    );

    if (error) {
      console.error('Error saving income/expenses:', error);
      return false;
    }
    return true;
  }, [user]);

  return {
    fetchProducts,
    fetchCampaigns,
    fetchWeeklyResults,
    fetchIncomeExpenses,
    saveProducts,
    saveCampaigns,
    saveWeeklyResults,
    saveIncomeExpenses,
  };
}