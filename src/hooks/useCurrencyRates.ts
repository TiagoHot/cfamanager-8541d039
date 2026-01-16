import { useState, useEffect, useCallback } from 'react';
import { CURRENCY_RATES } from '@/types';
import { toast } from 'sonner';

const DOLLAR_RATE_KEY = 'app_currency_rate_usd';
const EURO_RATE_KEY = 'app_currency_rate_eur';

interface CurrencyRates {
  Dollar: number;
  Euro: number;
}

interface CurrencyRatesContextType {
  rates: CurrencyRates;
  updateRate: (currency: 'Dollar' | 'Euro', rate: number) => void;
  saveRates: () => void;
}

export function useCurrencyRates(): CurrencyRatesContextType {
  const [rates, setRates] = useState<CurrencyRates>({
    Dollar: CURRENCY_RATES['Dólar'],
    Euro: CURRENCY_RATES['Euro'],
  });
  
  // State to track unsaved changes
  const [localRates, setLocalRates] = useState<CurrencyRates>(rates);

  // Load from localStorage on mount
  useEffect(() => {
    const storedDollar = localStorage.getItem(DOLLAR_RATE_KEY);
    const storedEuro = localStorage.getItem(EURO_RATE_KEY);
    
    const dollarRate = storedDollar ? parseFloat(storedDollar) : CURRENCY_RATES['Dólar'];
    const euroRate = storedEuro ? parseFloat(storedEuro) : CURRENCY_RATES['Euro'];
    
    const loadedRates = {
      Dollar: isNaN(dollarRate) ? CURRENCY_RATES['Dólar'] : dollarRate,
      Euro: isNaN(euroRate) ? CURRENCY_RATES['Euro'] : euroRate,
    };
    
    setRates(loadedRates);
    setLocalRates(loadedRates);
  }, []);

  // Function to update local state (before saving)
  const updateRate = useCallback((currency: 'Dollar' | 'Euro', rate: number) => {
    setLocalRates(prev => ({
      ...prev,
      [currency]: rate,
    }));
  }, []);

  // Function to save rates to localStorage and update global rates
  const saveRates = useCallback(() => {
    localStorage.setItem(DOLLAR_RATE_KEY, localRates.Dollar.toString());
    localStorage.setItem(EURO_RATE_KEY, localRates.Euro.toString());
    
    // Update the global CURRENCY_RATES object (in memory)
    CURRENCY_RATES['Dólar'] = localRates.Dollar;
    CURRENCY_RATES['Euro'] = localRates.Euro;
    
    setRates(localRates);
    toast.success('Taxas de câmbio salvas com sucesso!');
  }, [localRates]);

  return {
    rates: localRates, // Return localRates for input binding
    updateRate,
    saveRates,
  };
}