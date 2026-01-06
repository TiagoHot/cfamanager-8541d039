import { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CampaignResult, WeeklyResult, IncomeExpense } from '@/types';
import { 
  mockProducts, 
  mockCampaignResults, 
  mockWeeklyResults, 
  mockIncomeExpenses 
} from '@/data/mockData';

interface DataContextType {
  products: Product[];
  campaigns: CampaignResult[];
  weeklyResults: WeeklyResult[];
  incomeExpenses: IncomeExpense[];
  setProducts: (products: Product[]) => void;
  setCampaigns: (campaigns: CampaignResult[]) => void;
  setWeeklyResults: (results: WeeklyResult[]) => void;
  setIncomeExpenses: (items: IncomeExpense[]) => void;
  importData: (data: {
    products: Product[];
    campaigns: CampaignResult[];
    weekly: WeeklyResult[];
    incomeExpenses: IncomeExpense[];
  }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [campaigns, setCampaigns] = useState<CampaignResult[]>(mockCampaignResults);
  const [weeklyResults, setWeeklyResults] = useState<WeeklyResult[]>(mockWeeklyResults);
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpense[]>(mockIncomeExpenses);

  const importData = (data: {
    products: Product[];
    campaigns: CampaignResult[];
    weekly: WeeklyResult[];
    incomeExpenses: IncomeExpense[];
  }) => {
    if (data.products.length > 0) setProducts(data.products);
    if (data.campaigns.length > 0) setCampaigns(data.campaigns);
    if (data.weekly.length > 0) setWeeklyResults(data.weekly);
    if (data.incomeExpenses.length > 0) setIncomeExpenses(data.incomeExpenses);
  };

  return (
    <DataContext.Provider
      value={{
        products,
        campaigns,
        weeklyResults,
        incomeExpenses,
        setProducts,
        setCampaigns,
        setWeeklyResults,
        setIncomeExpenses,
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
