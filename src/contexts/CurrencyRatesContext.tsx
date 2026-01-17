import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CURRENCY_RATES } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const DOLLAR_RATE_KEY = 'app_currency_rate_usd';
const EURO_RATE_KEY = 'app_currency_rate_eur';
const LAST_UPDATE_KEY = 'app_currency_last_update';

interface CurrencyRates {
  Dollar: number;
  Euro: number;
}

interface CurrencyRatesContextType {
  rates: CurrencyRates;
  updateRate: (currency: 'Dollar' | 'Euro', rate: number) => void;
  saveRates: () => void;
  fetchRatesFromAPI: () => Promise<void>;
  isLoading: boolean;
  lastUpdate: string | null;
}

const CurrencyRatesContext = createContext<CurrencyRatesContextType | undefined>(undefined);

export function CurrencyRatesProvider({ children }: { children: ReactNode }) {
  // State for the currently displayed rates (used by AppLayout and Settings inputs)
  const [rates, setRates] = useState<CurrencyRates>({
    Dollar: CURRENCY_RATES['Dólar'],
    Euro: CURRENCY_RATES['Euro'],
  });
  
  // State for loading and last update time
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedDollar = localStorage.getItem(DOLLAR_RATE_KEY);
    const storedEuro = localStorage.getItem(EURO_RATE_KEY);
    const storedLastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    
    const dollarRate = storedDollar ? parseFloat(storedDollar) : CURRENCY_RATES['Dólar'];
    const euroRate = storedEuro ? parseFloat(storedEuro) : CURRENCY_RATES['Euro'];
    
    const loadedRates = {
      Dollar: isNaN(dollarRate) ? CURRENCY_RATES['Dólar'] : dollarRate,
      Euro: isNaN(euroRate) ? CURRENCY_RATES['Euro'] : euroRate,
    };
    
    // Update global mutable object immediately on load
    CURRENCY_RATES['Dólar'] = loadedRates.Dollar;
    CURRENCY_RATES['Euro'] = loadedRates.Euro;
    
    setRates(loadedRates);
    setLastUpdate(storedLastUpdate);
  }, []);

  // Function to update rates temporarily (used by input fields in Settings)
  const updateRate = useCallback((currency: 'Dollar' | 'Euro', rate: number) => {
    setRates(prev => ({
      ...prev,
      [currency]: rate,
    }));
  }, []);

  // Function to save rates permanently (updates localStorage and global object)
  const saveRates = useCallback(() => {
    // Use current state 'rates' for saving
    localStorage.setItem(DOLLAR_RATE_KEY, rates.Dollar.toString());
    localStorage.setItem(EURO_RATE_KEY, rates.Euro.toString());
    
    // Update global CURRENCY_RATES object
    CURRENCY_RATES['Dólar'] = rates.Dollar;
    CURRENCY_RATES['Euro'] = rates.Euro;
    
    // Since 'rates' state is already updated via updateRate, we just toast success.
    toast.success('Taxas de câmbio salvas com sucesso!');
  }, [rates]);

  const fetchRatesFromAPI = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-currency-rates');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar cotações');
      }
      
      const newRates = {
        Dollar: data.rates.USD,
        Euro: data.rates.EUR,
      };
      
      // Update state (triggers re-render in all consumers)
      setRates(newRates);
      
      // Persist to localStorage
      localStorage.setItem(DOLLAR_RATE_KEY, newRates.Dollar.toString());
      localStorage.setItem(EURO_RATE_KEY, newRates.Euro.toString());
      
      const now = new Date().toLocaleString('pt-BR');
      localStorage.setItem(LAST_UPDATE_KEY, now);
      setLastUpdate(now);
      
      // Update global CURRENCY_RATES
      CURRENCY_RATES['Dólar'] = newRates.Dollar;
      CURRENCY_RATES['Euro'] = newRates.Euro;
      
      toast.success('Cotações atualizadas com sucesso!', {
        description: `USD: R$ ${newRates.Dollar.toFixed(4)} | EUR: R$ ${newRates.Euro.toFixed(4)}`,
      });
    } catch (error: any) {
      console.error('Error fetching rates:', error);
      toast.error('Erro ao buscar cotações', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [rates]);

  const value = {
    rates,
    updateRate,
    saveRates,
    fetchRatesFromAPI,
    isLoading,
    lastUpdate,
  };

  return (
    <CurrencyRatesContext.Provider value={value}>
      {children}
    </CurrencyRatesContext.Provider>
  );
}

export function useCurrencyRates() {
  const context = useContext(CurrencyRatesContext);
  if (context === undefined) {
    throw new Error('useCurrencyRates must be used within a CurrencyRatesProvider');
  }
  return context;
}