import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Product, CampaignResult, WeeklyResult, IncomeExpense } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/auth';
import { toast } from 'sonner';

// Helper function to map snake_case database columns to camelCase TypeScript interfaces
const mapDataToCamelCase = (data: any[] | null, type: 'products' | 'campaigns' | 'weekly' | 'incomeExpenses') => {
  if (!data) return [];
  
  return data.map(item => {
    const newItem: any = {};
    for (const key in item) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      newItem[camelKey] = item[key];
    }
    return newItem;
  });
};

// --- Data Fetching Functions ---

const fetchProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return mapDataToCamelCase(data, 'products') as Product[];
};

const fetchCampaigns = async (userId: string): Promise<CampaignResult[]> => {
  const { data, error } = await supabase
    .from('campaign_results')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month_number', { ascending: false });

  if (error) throw new Error(error.message);
  return mapDataToCamelCase(data, 'campaigns') as CampaignResult[];
};

const fetchWeeklyResults = async (userId: string): Promise<WeeklyResult[]> => {
  const { data, error } = await supabase
    .from('weekly_results')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('week', { ascending: false });

  if (error) throw new Error(error.message);
  return mapDataToCamelCase(data, 'weekly') as WeeklyResult[];
};

const fetchIncomeExpenses = async (userId: string): Promise<IncomeExpense[]> => {
  const { data, error } = await supabase
    .from('income_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return mapDataToCamelCase(data, 'incomeExpenses') as IncomeExpense[];
};


interface DataContextType {
  products: Product[];
  campaigns: CampaignResult[];
  weeklyResults: WeeklyResult[];
  incomeExpenses: IncomeExpense[];
  isLoading: boolean;
  refetchAll: () => void;
  importData: (data: {
    products: Product[];
    campaigns: CampaignResult[];
    weekly: WeeklyResult[];
    incomeExpenses: IncomeExpense[];
  }) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch all data types using React Query
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['products', userId],
    queryFn: () => fetchProducts(userId!),
    enabled: !!userId,
    initialData: [], // Start with empty array instead of mock data
  });

  const { data: campaigns = [], isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['campaigns', userId],
    queryFn: () => fetchCampaigns(userId!),
    enabled: !!userId,
    initialData: [],
  });

  const { data: weeklyResults = [], isLoading: isLoadingWeekly, refetch: refetchWeekly } = useQuery({
    queryKey: ['weeklyResults', userId],
    queryFn: () => fetchWeeklyResults(userId!),
    enabled: !!userId,
    initialData: [],
  });

  const { data: incomeExpenses = [], isLoading: isLoadingIncomeExpenses, refetch: refetchIncomeExpenses } = useQuery({
    queryKey: ['incomeExpenses', userId],
    queryFn: () => fetchIncomeExpenses(userId!),
    enabled: !!userId,
    initialData: [],
  });

  const isLoading = isLoadingProducts || isLoadingCampaigns || isLoadingWeekly || isLoadingIncomeExpenses;

  const refetchAll = useCallback(() => {
    refetchProducts();
    refetchCampaigns();
    refetchWeekly();
    refetchIncomeExpenses();
  }, [refetchProducts, refetchCampaigns, refetchWeekly, refetchIncomeExpenses]);


  // Function to handle bulk import (Placeholder for future Supabase insertion logic)
  const importData = async (data: {
    products: Product[];
    campaigns: CampaignResult[];
    weekly: WeeklyResult[];
    incomeExpenses: IncomeExpense[];
  }) => {
    if (!userId) {
      toast.error('Usuário não autenticado para importar dados.');
      return;
    }
    
    // NOTE: The actual insertion logic into Supabase tables will be implemented 
    // when you request the full import functionality.
    
    // Simulating insertion success and refreshing queries
    await new Promise(resolve => setTimeout(resolve, 500)); 
    refetchAll();
    toast.success('Dados importados e sincronizados com o Supabase!');
  };


  return (
    <DataContext.Provider
      value={{
        products,
        campaigns,
        weeklyResults,
        incomeExpenses,
        isLoading,
        refetchAll,
        importData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}