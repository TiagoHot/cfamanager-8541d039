import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, CampaignResult, WeeklyResult, IncomeExpense } from '@/types';
import { useAuth } from './AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface DataContextType {
  products: Product[];
  campaigns: CampaignResult[];
  weeklyResults: WeeklyResult[];
  incomeExpenses: IncomeExpense[];
  isLoading: boolean;
  setProducts: (products: Product[]) => void;
  setCampaigns: (campaigns: CampaignResult[]) => void;
  setWeeklyResults: (results: WeeklyResult[]) => void;
  setIncomeExpenses: (items: IncomeExpense[]) => void;
  addProduct: (product: Product) => void;
  addCampaign: (campaign: CampaignResult) => void;
  addWeeklyResult: (result: WeeklyResult) => void;
  addIncomeExpense: (item: IncomeExpense) => void;
  importData: (data: {
    products: Product[];
    campaigns: CampaignResult[];
    weekly: WeeklyResult[];
    incomeExpenses: IncomeExpense[];
  }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [products, setProductsState] = useState<Product[]>([]);
  const [campaigns, setCampaignsState] = useState<CampaignResult[]>([]);
  const [weeklyResults, setWeeklyResultsState] = useState<WeeklyResult[]>([]);
  const [incomeExpenses, setIncomeExpensesState] = useState<IncomeExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    fetchProducts,
    fetchCampaigns,
    fetchWeeklyResults,
    fetchIncomeExpenses,
    saveProducts,
    saveCampaigns,
    saveWeeklyResults,
    saveIncomeExpenses,
  } = useSupabaseData();

  const loadData = useCallback(async () => {
    if (!user) {
      setProductsState([]);
      setCampaignsState([]);
      setWeeklyResultsState([]);
      setIncomeExpensesState([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [productsData, campaignsData, weeklyData, incomeExpensesData] = await Promise.all([
        fetchProducts(),
        fetchCampaigns(),
        fetchWeeklyResults(),
        fetchIncomeExpenses(),
      ]);

      setProductsState(productsData);
      setCampaignsState(campaignsData);
      setWeeklyResultsState(weeklyData);
      setIncomeExpensesState(incomeExpensesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchProducts, fetchCampaigns, fetchWeeklyResults, fetchIncomeExpenses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setProducts = useCallback(async (newProducts: Product[]) => {
    setProductsState(newProducts);
    if (user) {
      const success = await saveProducts(newProducts);
      if (!success) {
        toast.error('Erro ao salvar produtos');
      }
    }
  }, [user, saveProducts]);

  const setCampaigns = useCallback(async (newCampaigns: CampaignResult[]) => {
    setCampaignsState(newCampaigns);
    if (user) {
      const success = await saveCampaigns(newCampaigns);
      if (!success) {
        toast.error('Erro ao salvar campanhas');
      }
    }
  }, [user, saveCampaigns]);

  const setWeeklyResults = useCallback(async (newResults: WeeklyResult[]) => {
    setWeeklyResultsState(newResults);
    if (user) {
      const success = await saveWeeklyResults(newResults);
      if (!success) {
        toast.error('Erro ao salvar resultados semanais');
      }
    }
  }, [user, saveWeeklyResults]);

  const setIncomeExpenses = useCallback(async (newItems: IncomeExpense[]) => {
    setIncomeExpensesState(newItems);
    if (user) {
      const success = await saveIncomeExpenses(newItems);
      if (!success) {
        toast.error('Erro ao salvar receitas/despesas');
      }
    }
  }, [user, saveIncomeExpenses]);

  const addProduct = useCallback((product: Product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);
  }, [products, setProducts]);

  const addCampaign = useCallback((campaign: CampaignResult) => {
    const newCampaigns = [...campaigns, campaign];
    setCampaigns(newCampaigns);
  }, [campaigns, setCampaigns]);

  const addWeeklyResult = useCallback((result: WeeklyResult) => {
    const newResults = [...weeklyResults, result];
    setWeeklyResults(newResults);
  }, [weeklyResults, setWeeklyResults]);

  const addIncomeExpense = useCallback((item: IncomeExpense) => {
    const newItems = [...incomeExpenses, item];
    setIncomeExpenses(newItems);
  }, [incomeExpenses, setIncomeExpenses]);

  const importData = useCallback(async (data: {
    products: Product[];
    campaigns: CampaignResult[];
    weekly: WeeklyResult[];
    incomeExpenses: IncomeExpense[];
  }) => {
    if (!user) {
      toast.error('Faça login para importar dados');
      return;
    }

    setIsLoading(true);
    try {
      const results = await Promise.all([
        data.products.length > 0 ? saveProducts(data.products) : Promise.resolve(true),
        data.campaigns.length > 0 ? saveCampaigns(data.campaigns) : Promise.resolve(true),
        data.weekly.length > 0 ? saveWeeklyResults(data.weekly) : Promise.resolve(true),
        data.incomeExpenses.length > 0 ? saveIncomeExpenses(data.incomeExpenses) : Promise.resolve(true),
      ]);

      const allSuccess = results.every(r => r);
      
      if (allSuccess) {
        // Update local state
        if (data.products.length > 0) setProductsState(data.products);
        if (data.campaigns.length > 0) setCampaignsState(data.campaigns);
        if (data.weekly.length > 0) setWeeklyResultsState(data.weekly);
        if (data.incomeExpenses.length > 0) setIncomeExpensesState(data.incomeExpenses);
        
        toast.success('Dados importados com sucesso!');
      } else {
        toast.error('Erro ao importar alguns dados');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro ao importar dados');
    } finally {
      setIsLoading(false);
    }
  }, [user, saveProducts, saveCampaigns, saveWeeklyResults, saveIncomeExpenses]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return (
    <DataContext.Provider
      value={{
        products,
        campaigns,
        weeklyResults,
        incomeExpenses,
        isLoading,
        setProducts,
        setCampaigns,
        setWeeklyResults,
        setIncomeExpenses,
        addProduct,
        addCampaign,
        addWeeklyResult,
        addIncomeExpense,
        importData,
        refreshData,
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
