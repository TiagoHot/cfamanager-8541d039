import { useState, useEffect, useCallback } from 'react';
import { NICHES as defaultNiches, PRODUCT_TYPES as defaultProductTypes, INCOME_SOURCES as defaultIncomeSources, EXPENSE_SOURCES as defaultExpenseSources } from '@/types';

const NICHE_STORAGE_KEY = 'app_settings_niches';
const TYPE_STORAGE_KEY = 'app_settings_product_types';
const INCOME_SOURCE_STORAGE_KEY = 'app_settings_income_sources';
const EXPENSE_SOURCE_STORAGE_KEY = 'app_settings_expense_sources';
const FREEDOM_THRESHOLD_KEY = 'app_settings_freedom_threshold';
const DEFAULT_FREEDOM_THRESHOLD = 60000;

interface SettingsContextType {
  niches: string[];
  productTypes: string[];
  incomeSources: string[];
  expenseSources: string[];
  freedomThreshold: number;
  addNiche: (niche: string) => void;
  removeNiche: (niche: string) => void;
  addProductType: (type: string) => void;
  removeProductType: (type: string) => void;
  addIncomeSource: (source: string) => void;
  removeIncomeSource: (source: string) => void;
  addExpenseSource: (source: string) => void;
  removeExpenseSource: (source: string) => void;
  setFreedomThreshold: (value: number) => void;
}

export function useSettings(): SettingsContextType {
  const [niches, setNiches] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [expenseSources, setExpenseSources] = useState<string[]>([]);
  const [freedomThreshold, setFreedomThresholdState] = useState<number>(DEFAULT_FREEDOM_THRESHOLD);

  // Load from localStorage on mount
  useEffect(() => {
    // Helper function to load and set state for string arrays
    const loadAndSetArray = (key: string, defaultList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      const stored = localStorage.getItem(key);
      let finalArray = defaultList;
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            finalArray = parsed;
          } else {
            console.warn(`Settings: Invalid data found in localStorage for key ${key}. Resetting to default.`);
            // If data is invalid, we use the default list and overwrite localStorage later
          }
        } catch (e) {
          console.error(`Settings: Failed to parse JSON from localStorage for key ${key}. Resetting to default.`, e);
        }
      }
      
      // Ensure the list is sorted upon loading
      setter(finalArray.sort());
    };
    
    // Helper function to load and set state for number
    const loadAndSetNumber = (key: string, defaultValue: number, setter: React.Dispatch<React.SetStateAction<number>>) => {
      const stored = localStorage.getItem(key);
      const parsed = stored ? parseFloat(stored) : defaultValue;
      setter(isNaN(parsed) ? defaultValue : parsed);
    };

    loadAndSetArray(NICHE_STORAGE_KEY, defaultNiches, setNiches);
    loadAndSetArray(TYPE_STORAGE_KEY, defaultProductTypes, setProductTypes);
    loadAndSetArray(INCOME_SOURCE_STORAGE_KEY, defaultIncomeSources, setIncomeSources);
    loadAndSetArray(EXPENSE_SOURCE_STORAGE_KEY, defaultExpenseSources, setExpenseSources);
    loadAndSetNumber(FREEDOM_THRESHOLD_KEY, DEFAULT_FREEDOM_THRESHOLD, setFreedomThresholdState);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(NICHE_STORAGE_KEY, JSON.stringify(niches));
  }, [niches]);

  useEffect(() => {
    localStorage.setItem(TYPE_STORAGE_KEY, JSON.stringify(productTypes));
  }, [productTypes]);
  
  useEffect(() => {
    localStorage.setItem(INCOME_SOURCE_STORAGE_KEY, JSON.stringify(incomeSources));
  }, [incomeSources]);
  
  useEffect(() => {
    localStorage.setItem(EXPENSE_SOURCE_STORAGE_KEY, JSON.stringify(expenseSources));
  }, [expenseSources]);
  
  useEffect(() => {
    localStorage.setItem(FREEDOM_THRESHOLD_KEY, freedomThreshold.toString());
  }, [freedomThreshold]);

  // --- Niche Management ---
  const addNiche = useCallback((niche: string) => {
    const normalizedNiche = niche.trim();
    if (!normalizedNiche) return;
    
    setNiches(prev => {
      if (prev.some(n => n.toLowerCase() === normalizedNiche.toLowerCase())) {
        return prev; // Niche already exists
      }
      const newNiches = [...prev, normalizedNiche].sort();
      return newNiches;
    });
  }, []);

  const removeNiche = useCallback((niche: string) => {
    setNiches(prev => prev.filter(n => n !== niche).sort());
  }, []);
  
  // --- Product Type Management ---
  const addProductType = useCallback((type: string) => {
    const normalizedType = type.trim();
    if (!normalizedType) return;
    
    setProductTypes(prev => {
      if (prev.some(t => t.toLowerCase() === normalizedType.toLowerCase())) {
        return prev; // Type already exists
      }
      const newTypes = [...prev, normalizedType].sort();
      return newTypes;
    });
  }, []);

  const removeProductType = useCallback((type: string) => {
    setProductTypes(prev => prev.filter(t => t !== type).sort());
  }, []);
  
  // --- Income Source Management ---
  const addIncomeSource = useCallback((source: string) => {
    const normalizedSource = source.trim();
    if (!normalizedSource) return;
    
    setIncomeSources(prev => {
      if (prev.some(s => s.toLowerCase() === normalizedSource.toLowerCase())) {
        return prev;
      }
      const newSources = [...prev, normalizedSource].sort();
      return newSources;
    });
  }, []);

  const removeIncomeSource = useCallback((source: string) => {
    setIncomeSources(prev => prev.filter(s => s !== source).sort());
  }, []);

  // --- Expense Source Management ---
  const addExpenseSource = useCallback((source: string) => {
    const normalizedSource = source.trim();
    if (!normalizedSource) return;
    
    setExpenseSources(prev => {
      if (prev.some(s => s.toLowerCase() === normalizedSource.toLowerCase())) {
        return prev;
      }
      const newSources = [...prev, normalizedSource].sort();
      return newSources;
    });
  }, []);

  const removeExpenseSource = useCallback((source: string) => {
    setExpenseSources(prev => prev.filter(s => s !== source).sort());
  }, []);
  
  // --- Freedom Threshold Management ---
  const setFreedomThreshold = useCallback((value: number) => {
    setFreedomThresholdState(value);
  }, []);

  return {
    niches,
    productTypes,
    incomeSources,
    expenseSources,
    freedomThreshold,
    addNiche,
    removeNiche,
    addProductType,
    removeProductType,
    addIncomeSource,
    removeIncomeSource,
    addExpenseSource,
    removeExpenseSource,
    setFreedomThreshold,
  };
}