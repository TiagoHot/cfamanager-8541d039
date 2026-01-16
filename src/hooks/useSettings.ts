import { useState, useEffect, useCallback } from 'react';
import { NICHES as defaultNiches, PRODUCT_TYPES as defaultProductTypes, INCOME_SOURCES as defaultIncomeSources, EXPENSE_SOURCES as defaultExpenseSources, DEFAULT_PLATFORMS as defaultPlatforms, DEFAULT_STRATEGIES as defaultStrategies } from '@/types';

const NICHE_STORAGE_KEY = 'app_settings_niches';
const TYPE_STORAGE_KEY = 'app_settings_product_types';
const INCOME_SOURCE_STORAGE_KEY = 'app_settings_income_sources';
const EXPENSE_SOURCE_STORAGE_KEY = 'app_settings_expense_sources';
const PLATFORM_STORAGE_KEY = 'app_settings_platforms';
const STRATEGY_STORAGE_KEY = 'app_settings_strategies'; // New key
const FREEDOM_THRESHOLD_KEY = 'app_settings_freedom_threshold';
const ADSENSE_LABEL_KEY = 'app_settings_adsense_label'; // New key
const DEFAULT_FREEDOM_THRESHOLD = 60000;
const DEFAULT_ADSENSE_LABEL = 'Outros';

interface SettingsContextType {
  niches: string[];
  productTypes: string[];
  incomeSources: string[];
  expenseSources: string[];
  platforms: string[];
  strategies: string[]; // New field
  freedomThreshold: number;
  adsenseLabel: string; // New field
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
  addPlatform: (platform: string) => void;
  removePlatform: (platform: string) => void;
  resetPlatforms: () => void;
  addStrategy: (strategy: string) => void; // New function
  removeStrategy: (strategy: string) => void; // New function
  resetStrategies: () => void; // New function
  setFreedomThreshold: (value: number) => void;
  resetFreedomThreshold: () => void;
  setAdsenseLabel: (label: string) => void; // New function
  resetAdsenseLabel: () => void; // New function
}

export function useSettings(): SettingsContextType {
  const [niches, setNiches] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [expenseSources, setExpenseSources] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<string[]>([]); // New state
  const [freedomThreshold, setFreedomThresholdState] = useState<number>(DEFAULT_FREEDOM_THRESHOLD);
  const [adsenseLabel, setAdsenseLabelState] = useState<string>(DEFAULT_ADSENSE_LABEL); // New state

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
    
    // Helper function to load and set state for string
    const loadAndSetString = (key: string, defaultValue: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
      const stored = localStorage.getItem(key);
      setter(stored || defaultValue);
    };

    loadAndSetArray(NICHE_STORAGE_KEY, defaultNiches, setNiches);
    loadAndSetArray(TYPE_STORAGE_KEY, defaultProductTypes, setProductTypes);
    loadAndSetArray(INCOME_SOURCE_STORAGE_KEY, defaultIncomeSources, setIncomeSources);
    loadAndSetArray(EXPENSE_SOURCE_STORAGE_KEY, defaultExpenseSources, setExpenseSources);
    loadAndSetArray(PLATFORM_STORAGE_KEY, defaultPlatforms, setPlatforms);
    loadAndSetArray(STRATEGY_STORAGE_KEY, defaultStrategies, setStrategies); // Load strategies
    loadAndSetNumber(FREEDOM_THRESHOLD_KEY, DEFAULT_FREEDOM_THRESHOLD, setFreedomThresholdState);
    loadAndSetString(ADSENSE_LABEL_KEY, DEFAULT_ADSENSE_LABEL, setAdsenseLabelState); // Load adsense label
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
    if (platforms.length > 0) {
      localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(platforms));
    }
  }, [platforms]);
  
  useEffect(() => {
    if (strategies.length > 0) {
      localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(strategies));
    }
  }, [strategies]); // Save strategies
  
  useEffect(() => {
    localStorage.setItem(FREEDOM_THRESHOLD_KEY, freedomThreshold.toString());
  }, [freedomThreshold]);
  
  useEffect(() => {
    localStorage.setItem(ADSENSE_LABEL_KEY, adsenseLabel);
  }, [adsenseLabel]); // Save adsense label

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
  
  // --- Platform Management ---
  const addPlatform = useCallback((platform: string) => {
    const normalizedPlatform = platform.trim();
    if (!normalizedPlatform) return;
    
    setPlatforms(prev => {
      if (prev.some(p => p.toLowerCase() === normalizedPlatform.toLowerCase())) {
        return prev;
      }
      const newPlatforms = [...prev, normalizedPlatform].sort();
      return newPlatforms;
    });
  }, []);

  const removePlatform = useCallback((platform: string) => {
    setPlatforms(prev => prev.filter(p => p !== platform).sort());
  }, []);

  const resetPlatforms = useCallback(() => {
    setPlatforms(defaultPlatforms.sort());
    localStorage.removeItem(PLATFORM_STORAGE_KEY);
  }, []);
  
  // --- Strategy Management ---
  const addStrategy = useCallback((strategy: string) => {
    const normalizedStrategy = strategy.trim();
    if (!normalizedStrategy) return;
    
    setStrategies(prev => {
      if (prev.some(s => s.toLowerCase() === normalizedStrategy.toLowerCase())) {
        return prev;
      }
      const newStrategies = [...prev, normalizedStrategy].sort();
      return newStrategies;
    });
  }, []);

  const removeStrategy = useCallback((strategy: string) => {
    setStrategies(prev => prev.filter(s => s !== strategy).sort());
  }, []);

  const resetStrategies = useCallback(() => {
    setStrategies(defaultStrategies.sort());
    localStorage.removeItem(STRATEGY_STORAGE_KEY);
  }, []);
  
  // --- Freedom Threshold Management ---
  const setFreedomThreshold = useCallback((value: number) => {
    setFreedomThresholdState(value);
  }, []);
  
  const resetFreedomThreshold = useCallback(() => {
    setFreedomThresholdState(DEFAULT_FREEDOM_THRESHOLD);
    localStorage.removeItem(FREEDOM_THRESHOLD_KEY);
  }, []);
  
  // --- Adsense Label Management ---
  const setAdsenseLabel = useCallback((label: string) => {
    setAdsenseLabelState(label.trim() || DEFAULT_ADSENSE_LABEL);
  }, []);
  
  const resetAdsenseLabel = useCallback(() => {
    setAdsenseLabelState(DEFAULT_ADSENSE_LABEL);
    localStorage.removeItem(ADSENSE_LABEL_KEY);
  }, []);


  return {
    niches,
    productTypes,
    incomeSources,
    expenseSources,
    platforms,
    strategies, // Export strategies
    freedomThreshold,
    adsenseLabel, // Export adsense label
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
    addPlatform,
    removePlatform,
    resetPlatforms,
    addStrategy, // Export strategy functions
    removeStrategy, // Export strategy functions
    resetStrategies, // Export strategy functions
    setFreedomThreshold,
    resetFreedomThreshold,
    setAdsenseLabel, // Export adsense label functions
    resetAdsenseLabel, // Export adsense label functions
  };
}