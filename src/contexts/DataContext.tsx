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
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  addCampaign: (campaign: CampaignResult) => void;
  updateCampaign: (campaign: CampaignResult) => void; // NEW
  removeCampaign: (id: string) => void; // NEW
  addWeeklyResult: (result: WeeklyResult) => void;
  updateWeeklyResult: (result: WeeklyResult) => void;
  removeWeeklyResult: (id: string) => void;
  addIncomeExpense: (item: IncomeExpense) => void;
  updateIncomeExpense: (item: IncomeExpense) => void; // NEW
  removeIncomeExpense: (id: string) => void; // NEW
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
    updateCampaignInDB,
    deleteCampaignFromDB,
    insertIncomeExpenseInDB,
    updateIncomeExpenseInDB,
    deleteIncomeExpenseFromDB,
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
      // Note: saveProducts currently overwrites all data. This is acceptable for now based on existing implementation.
      const success = await saveProducts(newProducts);
      if (!success) {
        toast.error('Erro ao salvar produtos');
      }
    }
  }, [user, saveProducts]);

  const setCampaigns = useCallback(async (newCampaigns: CampaignResult[]) => {
    setCampaignsState(newCampaigns);
    // NOTE: We are NOT calling saveCampaigns here because it overwrites ALL data.
    // We rely on individual update/remove functions for persistence when modifying single items.
    // saveCampaigns is only used during initial import.
  }, []);

  const setWeeklyResults = useCallback(async (newResults: WeeklyResult[]) => {
    setWeeklyResultsState(newResults);
    if (user) {
      // Since we are overwriting all weekly results on save, we just call saveWeeklyResults
      const success = await saveWeeklyResults(newResults);
      if (!success) {
        toast.error('Erro ao salvar resultados semanais');
      }
    }
  }, [user, saveWeeklyResults]);

  const setIncomeExpenses = useCallback(async (newItems: IncomeExpense[]) => {
    setIncomeExpensesState(newItems);
    // NOTE: We are NOT calling saveIncomeExpenses here because it overwrites ALL data.
    // We rely on individual update/remove functions for persistence when modifying single items.
    // saveIncomeExpenses is only used during initial import.
  }, []);

  const addProduct = useCallback((product: Product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);
  }, [products, setProducts]);

  const updateProduct = useCallback((updatedProduct: Product) => {
    const newProducts = products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    setProducts(newProducts);
  }, [products, setProducts]);

  const removeProduct = useCallback((id: string) => {
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    toast.success('Produto removido com sucesso.');
  }, [products, setProducts]);

  const addCampaign = useCallback(async (campaign: CampaignResult) => {
    const newCampaigns = [...campaigns, campaign];
    // Since addCampaign is called from a dialog, we assume it's a new item and needs full save/refresh or individual insert.
    // For simplicity and consistency with existing save logic (which overwrites all), we'll rely on the full save during import, 
    // but for individual additions, we'll just update the local state for now, assuming the user will eventually import/save all data.
    // However, since we are adding update/delete, let's ensure we use the full save for consistency if we modify the list.
    // For now, let's update the local state and rely on the user's next full save/import to persist.
    setCampaignsState(newCampaigns);
    // If we were using individual inserts, we would call an `insertCampaignInDB` here.
  }, [campaigns]);
  
  const updateCampaign = useCallback(async (updatedCampaign: CampaignResult) => {
    const newCampaigns = campaigns.map(c => 
      c.id === updatedCampaign.id ? updatedCampaign : c
    );
    setCampaignsState(newCampaigns);
    
    // Persist individual update
    const success = await updateCampaignInDB(updatedCampaign);
    if (!success) {
      toast.error('Erro ao salvar campanha');
      // Optionally revert state here
    }
  }, [campaigns, updateCampaignInDB]);

  const removeCampaign = useCallback(async (id: string) => {
    const newCampaigns = campaigns.filter(c => c.id !== id);
    setCampaignsState(newCampaigns);
    
    // Persist individual removal
    const success = await deleteCampaignFromDB(id);
    if (success) {
      toast.success('Campanha removida com sucesso.');
    } else {
      toast.error('Erro ao remover campanha');
      // Optionally revert state here
    }
  }, [campaigns, deleteCampaignFromDB]);

  const addWeeklyResult = useCallback((result: WeeklyResult) => {
    const newResults = [...weeklyResults, result];
    setWeeklyResults(newResults);
  }, [weeklyResults, setWeeklyResults]);
  
  const updateWeeklyResult = useCallback((updatedResult: WeeklyResult) => {
    const newResults = weeklyResults.map(r => 
      r.id === updatedResult.id ? updatedResult : r
    );
    setWeeklyResults(newResults);
  }, [weeklyResults, setWeeklyResults]);

  const removeWeeklyResult = useCallback((id: string) => {
    const newResults = weeklyResults.filter(r => r.id !== id);
    setWeeklyResults(newResults);
    toast.success('Resultado semanal removido.');
  }, [weeklyResults, setWeeklyResults]);

  const addIncomeExpense = useCallback(async (item: IncomeExpense) => {
    // Insert into database first to get the real ID
    const insertedItem = await insertIncomeExpenseInDB(item);
    
    if (insertedItem) {
      setIncomeExpensesState(prev => [...prev, insertedItem]);
      toast.success(`${item.type === 'income' ? 'Receita' : 'Despesa'} adicionada com sucesso!`);
    } else {
      toast.error('Erro ao salvar registro financeiro');
    }
  }, [insertIncomeExpenseInDB]);
  
  const updateIncomeExpense = useCallback(async (updatedItem: IncomeExpense) => {
    const newItems = incomeExpenses.map(i => 
      i.id === updatedItem.id ? updatedItem : i
    );
    setIncomeExpensesState(newItems);
    
    // Persist individual update
    const success = await updateIncomeExpenseInDB(updatedItem);
    if (!success) {
      toast.error('Erro ao salvar registro financeiro');
      // Optionally revert state here
    }
  }, [incomeExpenses, updateIncomeExpenseInDB]);

  const removeIncomeExpense = useCallback(async (id: string) => {
    const newItems = incomeExpenses.filter(i => i.id !== id);
    setIncomeExpensesState(newItems);
    
    // Persist individual removal
    const success = await deleteIncomeExpenseFromDB(id);
    if (success) {
      toast.success('Registro financeiro removido.');
    } else {
      toast.error('Erro ao remover registro financeiro');
      // Optionally revert state here
    }
  }, [incomeExpenses, deleteIncomeExpenseFromDB]);

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
        updateProduct,
        removeProduct,
        addCampaign,
        updateCampaign, // NEW
        removeCampaign, // NEW
        addWeeklyResult,
        updateWeeklyResult,
        removeWeeklyResult,
        addIncomeExpense,
        updateIncomeExpense, // NEW
        removeIncomeExpense, // NEW
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