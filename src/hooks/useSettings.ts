import { useState, useEffect, useCallback } from 'react';
import { NICHES as defaultNiches, PRODUCT_TYPES as defaultProductTypes } from '@/types';

const NICHE_STORAGE_KEY = 'app_settings_niches';
const TYPE_STORAGE_KEY = 'app_settings_product_types';

interface SettingsContextType {
  niches: string[];
  productTypes: string[];
  addNiche: (niche: string) => void;
  removeNiche: (niche: string) => void;
  resetNiches: () => void;
  addProductType: (type: string) => void;
  removeProductType: (type: string) => void;
  resetProductTypes: () => void;
}

export function useSettings(): SettingsContextType {
  const [niches, setNiches] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    // Load Niches
    const storedNiches = localStorage.getItem(NICHE_STORAGE_KEY);
    try {
      const parsedNiches = storedNiches ? JSON.parse(storedNiches) : defaultNiches;
      setNiches(Array.isArray(parsedNiches) ? parsedNiches.sort() : defaultNiches.sort());
    } catch {
      setNiches(defaultNiches.sort());
    }

    // Load Product Types
    const storedTypes = localStorage.getItem(TYPE_STORAGE_KEY);
    try {
      const parsedTypes = storedTypes ? JSON.parse(storedTypes) : defaultProductTypes;
      setProductTypes(Array.isArray(parsedTypes) ? parsedTypes.sort() : defaultProductTypes.sort());
    } catch {
      setProductTypes(defaultProductTypes.sort());
    }
  }, []);

  // Save to localStorage whenever niches change
  useEffect(() => {
    if (niches.length > 0) {
      localStorage.setItem(NICHE_STORAGE_KEY, JSON.stringify(niches));
    }
  }, [niches]);

  // Save to localStorage whenever productTypes change
  useEffect(() => {
    if (productTypes.length > 0) {
      localStorage.setItem(TYPE_STORAGE_KEY, JSON.stringify(productTypes));
    }
  }, [productTypes]);

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

  return {
    niches,
    productTypes,
    addNiche,
    removeNiche,
    resetNiches,
    addProductType,
    removeProductType,
    resetProductTypes,
  };
}