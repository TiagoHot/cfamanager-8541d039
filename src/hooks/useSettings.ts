import { useState, useEffect, useCallback } from 'react';
import { NICHES as defaultNiches } from '@/types';

const STORAGE_KEY = 'app_settings_niches';

interface SettingsContextType {
  niches: string[];
  addNiche: (niche: string) => void;
  removeNiche: (niche: string) => void;
  resetNiches: () => void;
}

export function useSettings(): SettingsContextType {
  const [niches, setNiches] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedNiches = localStorage.getItem(STORAGE_KEY);
    if (storedNiches) {
      try {
        const parsed = JSON.parse(storedNiches);
        setNiches(Array.isArray(parsed) ? parsed.sort() : defaultNiches.sort());
      } catch {
        setNiches(defaultNiches.sort());
      }
    } else {
      setNiches(defaultNiches.sort());
    }
  }, []);

  // Save to localStorage whenever niches change
  useEffect(() => {
    if (niches.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(niches));
    }
  }, [niches]);

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
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    niches,
    addNiche,
    removeNiche,
    resetNiches,
  };
}