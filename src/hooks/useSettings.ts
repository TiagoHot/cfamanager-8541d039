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
  resetNiches: () => void;
  addProductType: (type: string) => void;
  removeProductType: (type: string) => void;
  resetProductTypes: () => void;
  addIncomeSource: (source: string) => void;
  removeIncomeSource: (source: string) => void;
  resetIncomeSources: () => void;
  addExpenseSource: (source: string) => void;
  removeExpenseSource: (source: string) => void;
  resetExpenseSources: () => void;
  setFreedomThreshold: (value: number) => void;
  resetFreedomThreshold: () => void;
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
      try {
        const parsed = stored ? JSON.parse(stored) : defaultList;
        setter(Array.isArray(parsed) ? parsed.sort() : defaultList.sort());
      } catch {
        setter(defaultList.sort());
      }
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
    if (niches.length > 0) {
      localStorage.setItem(NICHE_STORAGE_KEY, JSON.stringify(niches));
    }
  }, [niches]);

  useEffect(() => {
    if (productTypes.length > 0) {
      localStorage.setItem(TYPE_STORAGE_KEY, JSON.stringify(productTypes));
    }
  }, [productTypes]);
  
  useEffect(() => {
    if (incomeSources.length > 0) {
      localStorage.setItem(INCOME_SOURCE_STORAGE_KEY, JSON.stringify(incomeSources));
    }
  }, [incomeSources]);
  
  useEffect(() => {
    if (expenseSources.length > 0) {
      localStorage.setItem(EXPENSE_SOURCE_STORAGE_KEY, JSON.stringify(expenseSources));
    }
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

  const resetNiches = useCallback(() => {
    setNiches(defaultNiches.sort());
    localStorage.removeItem(NICHE_STORAGE_KEY);
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

  const resetProductTypes = useCallback(() => {
    setProductTypes(defaultProductTypes.sort());
    localStorage.removeItem(TYPE_STORAGE_KEY);
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

  const resetIncomeSources = useCallback(() => {
    setIncomeSources(defaultIncomeSources.sort());
    localStorage.removeItem(INCOME_SOURCE_STORAGE_KEY);
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

  const resetExpenseSources = useCallback(() => {
    setExpenseSources(defaultExpenseSources.sort());
    localStorage.removeItem(EXPENSE_SOURCE_STORAGE_KEY);
  }, []);
  
  // --- Freedom Threshold Management ---
  const setFreedomThreshold = useCallback((value: number) => {
    setFreedomThresholdState(value);
  }, []);
  
  const resetFreedomThreshold = useCallback(() => {
    setFreedomThresholdState(DEFAULT_FREEDOM_THRESHOLD);
    localStorage.removeItem(FREEDOM_THRESHOLD_KEY);
  }, []);


  return {
    niches,
    productTypes,
    incomeSources,
    expenseSources,
    freedomThreshold,
    addNiche,
    removeNiche,
    resetNiches,
    addProductType,
    removeProductType,
    resetProductTypes,
    addIncomeSource,
    removeIncomeSource,
    resetIncomeSources,
    addExpenseSource,
    removeExpenseSource,
    resetExpenseSources,
    setFreedomThreshold,
    resetFreedomThreshold,
  };
}