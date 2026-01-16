import { useState, useEffect, useCallback } from 'react';
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

export function useCurrencyRates(): CurrencyRatesContextType {
  const [rates, setRates] = useState<CurrencyRates>({
    Dollar: CURRENCY_RATES['Dólar'],
    Euro: CURRENCY_RATES['Euro'],
  });
  
  const [localRates, setLocalRates] = useState<CurrencyRates>(rates);
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
    
    setRates(loadedRates);
    setLocalRates(loadedRates);
    setLastUpdate(storedLastUpdate);
  }, []);

  const updateRate = useCallback((currency: 'Dollar' | 'Euro', rate: number) => {
    setLocalRates(prev => ({
      ...prev,
      [currency]: rate,
    }));
  }, []);

  const saveRates = useCallback(() => {
    localStorage.setItem(DOLLAR_RATE_KEY, localRates.Dollar.toString());
    localStorage.setItem(EURO_RATE_KEY, localRates.Euro.toString());
    
    CURRENCY_RATES['Dólar'] = localRates.Dollar;
    CURRENCY_RATES['Euro'] = localRates.Euro;
    
    setRates(localRates);
    toast.success('Taxas de câmbio salvas com sucesso!');
  }, [localRates]);

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
      
      // Update local state
      setLocalRates(newRates);
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
  }, []);

  return {
    rates: localRates,
    updateRate,
    saveRates,
    fetchRatesFromAPI,
    isLoading,
    lastUpdate,
  };
}