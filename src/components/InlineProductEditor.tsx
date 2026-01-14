"use client";

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Product, PLATFORMS, CURRENCY_RATES } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useSettings } from '@/hooks/useSettings';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface InlineProductEditorProps {
  product: Product;
  field: keyof Product;
  children: React.ReactNode;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  className?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'info';
}

const InlineProductEditor: React.FC<InlineProductEditorProps> = ({
  product,
  field,
  children,
  type = 'text',
  options,
  className,
  badgeVariant = 'secondary',
}) => {
  const { updateProduct } = useData();
  const { niches, productTypes } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(product[field] ?? ''));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Determine options dynamically if not provided
  const dynamicOptions = useMemo(() => {
    if (options) return options;
    switch (field) {
      case 'type':
        return productTypes;
      case 'niche':
        return niches;
      case 'platform':
        return PLATFORMS;
      case 'country':
        return ['Brasil', 'Gringa'];
      default:
        return [];
    }
  }, [field, options, productTypes, niches]);

  const calculateCommissionBRL = useCallback((updatedProduct: Product): number => {
    const averageTicket = updatedProduct.averageTicket;
    const commissionPercent = updatedProduct.commissionPercent;
    const currency = updatedProduct.currency;
    const rate = CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES] || 1;
    return averageTicket * (commissionPercent / 100) * rate;
  }, []);

  const handleSave = useCallback(async (valueToSave?: string) => {
    const finalValue = valueToSave !== undefined ? valueToSave : localValue;
    
    if (!isEditing) return;

    let newValue: any = finalValue;
    let updatedProduct: Product = { ...product };
    let needsRecalculation = false;

    if (type === 'number') {
      newValue = parseFloat(finalValue) || 0;
    } else if (type === 'date') {
      newValue = finalValue;
    } else {
      newValue = finalValue.trim();
    }

    // Handle empty string for optional fields like notes
    if (type === 'textarea' && newValue === '') {
        newValue = '';
    } else if (type !== 'number' && type !== 'date' && newValue === String(product[field] ?? '')) {
      setIsEditing(false);
      return;
    } else if (type === 'number' && newValue === product[field]) {
      setIsEditing(false);
      return;
    }


    // 1. Update the specific field
    updatedProduct = { ...product, [field]: newValue };

    // 2. Check if commission needs recalculation
    if (field === 'averageTicket' || field === 'commissionPercent' || field === 'currency') {
      needsRecalculation = true;
    }
    
    // If we updated averageTicket or commissionPercent, recalculate commissionBRL
    if (needsRecalculation) {
      updatedProduct.commissionBRL = calculateCommissionBRL(updatedProduct);
    }

    try {
      await updateProduct(updatedProduct);
      
      // Update local state to reflect saved value (important for select fields)
      setLocalValue(String(newValue));

      // Only show toast if value actually changed significantly
      const oldValue = product[field];
      const valueChanged = type === 'number' 
        ? Math.abs(oldValue as number - newValue) > 0.001 
        : oldValue !== newValue;

      if (valueChanged) {
        toast.success(`Campo ${field} atualizado.`);
      }
      
    } catch (e) {
      toast.error('Erro ao salvar alteração.');
      // Revert local state if save fails
      setLocalValue(String(product[field] ?? ''));
    } finally {
      setIsEditing(false);
    }
  }, [isEditing, localValue, product, field, type, updateProduct, calculateCommissionBRL]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setLocalValue(String(product[field] ?? ''));
      setIsEditing(false);
    }
  };

  const handleFocus = () => {
    // Prevent editing if the field is commissionBRL (calculated)
    if (field === 'commissionBRL') return;

    setIsEditing(true);
    // Ensure local value is up-to-date when starting edit
    setLocalValue(String(product[field] ?? ''));
    
    // For select fields, we don't need to focus an input, the Select component handles opening itself
    if (type !== 'select') {
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                if (type === 'text' || type === 'number') {
                    (inputRef.current as HTMLInputElement).select();
                }
            }
        }, 0);
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'select':
        // For select, we trigger save immediately on value change
        return (
          <Select 
            value={localValue} 
            onValueChange={(v) => {
              // 1. Save the new value immediately
              handleSave(v);
              // 2. The handleSave will update localValue and set isEditing(false)
            }}
            open={isEditing}
            onOpenChange={(open) => {
                // If the user closes the select without changing the value, we just exit edit mode
                if (!open && isEditing) {
                    setIsEditing(false);
                }
            }}
          >
            <SelectTrigger className={cn("h-8 w-full text-sm", className)}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {dynamicOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={handleKeyDown}
            className={cn("h-20 text-sm", className)}
          />
        );
      case 'date':
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={handleKeyDown}
            className={cn("h-8 text-sm", className)}
          />
        );
      case 'number':
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            step={field === 'commissionPercent' ? "0.1" : "0.01"}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={handleKeyDown}
            className={cn("h-8 text-sm", className)}
          />
        );
      case 'text':
      default:
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={handleKeyDown}
            className={cn("h-8 text-sm", className)}
          />
        );
    }
  };

  // Special rendering for badges/notes when not editing
  const renderDisplay = () => {
    if (field === 'type' || field === 'niche' || field === 'platform' || field === 'country') {
      const displayValue = String(product[field] || 'Não Definido');
      const isDefault = displayValue === 'Não Definido' || displayValue === '';
      
      let variantClass = badgeVariant === 'secondary' ? 'bg-secondary/50 text-secondary-foreground' : 
                         badgeVariant === 'outline' ? 'border' : 
                         `bg-${badgeVariant}/10 text-${badgeVariant} border-${badgeVariant}/20`;

      if (isDefault) {
        variantClass = 'bg-muted/50 text-muted-foreground border-muted';
      } else if (field === 'country') {
        variantClass = displayValue === 'Brasil' 
          ? "bg-success/10 text-success border-success/20" 
          : "bg-info/10 text-info border-info/20";
      }

      return (
        <Badge 
          variant="secondary" 
          className={cn("text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity", variantClass)}
        >
          {displayValue}
        </Badge>
      );
    }
    
    if (field === 'averageTicket' || field === 'commissionBRL') {
        return formatCurrency(product[field] as number);
    }
    
    if (field === 'commissionPercent') {
        return `${(product[field] as number).toFixed(1)}%`;
    }
    
    if (field === 'date') {
        return formatDate(product[field] as string);
    }

    // Default rendering (name, notes, etc.)
    return children;
  };

  return (
    <div 
      className={cn("inline-block w-full min-h-[24px] cursor-pointer", className)}
      onClick={!isEditing ? handleFocus : undefined}
    >
      {isEditing && type !== 'select' ? (
        <div className="relative z-20">
          {renderInput()}
        </div>
      ) : isEditing && type === 'select' ? (
        // Render select input directly to manage open state
        <div className="relative z-20">
            {renderInput()}
        </div>
      ) : (
        <div className="truncate">
          {renderDisplay()}
        </div>
      )}
    </div>
  );
};

export default InlineProductEditor;