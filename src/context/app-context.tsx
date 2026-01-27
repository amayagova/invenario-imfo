'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Branch, Product, InventoryItem } from '@/lib/types';
import {
    fetchAllData,
    addBranch as addBranchAction,
    deleteBranch as deleteBranchAction,
    addProduct as addProductAction,
    addProductsFromCSV as addProductsFromCSVAction,
    deleteProduct as deleteProductAction,
    updateProduct as updateProductAction,
    updateInventoryCount as updateInventoryCountAction,
    createInventoryForNewBranch,
    updateInventoryOnProductUpdate,
    deleteAllProducts as deleteAllProductsAction,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface AppContextType {
  branches: Branch[];
  products: Product[];
  inventory: InventoryItem[];
  addBranch: (branch: { name: string; location: string }) => Promise<void>;
  addProduct: (product: { code: string; description: string }) => Promise<Product | null>;
  addProductsFromCSV: (parsedProducts: {code: string, description: string}[]) => Promise<Product[]>;
  deleteBranch: (branchId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  deleteAllProducts: () => Promise<void>;
  updateProduct: (product: Product) => Promise<boolean>;
  updateInventoryCount: (itemId: string, physicalCount: number, systemCount: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllData();
      setBranches(data.branches);
      setProducts(data.products);
      setInventory(data.inventory);
      setDbError(null);
    } catch (e: any) {
      console.error('Error refreshing data:', e);
      setDbError(e.message || 'Error desconocido al recargar los datos.');
      toast({
        variant: 'destructive',
        title: 'Error de Sincronización',
        description: e.message || 'No se pudieron obtener los datos más recientes.',
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addBranch = async (newBranchData: { name: string; location: string }) => {
    const newBranch = await addBranchAction(newBranchData);
    const newInventoryItems = await createInventoryForNewBranch(newBranch.id, products);
    setBranches(prev => [...prev, newBranch]);
    if (newInventoryItems.length > 0) {
      setInventory(prev => [...prev, ...newInventoryItems]);
    }
  };
  
  const addProduct = async (newProductData: { code: string; description: string }): Promise<Product | null> => {
     try {
        const { newProduct, newInventoryItems } = await addProductAction(newProductData);
        setProducts(prev => [...prev, newProduct]);
        if (newInventoryItems.length > 0) {
          setInventory(prev => [...prev, ...newInventoryItems]);
        }
        return newProduct;
    } catch(e: any) {
        if (e.message.includes('UNIQUE constraint failed: products.code')) {
            return null;
        }
        throw e;
    }
  };

  const addProductsFromCSV = async (parsedProducts: { code: string; description: string }[]): Promise<Product[]> => {
    const { newProducts, newInventoryItems } = await addProductsFromCSVAction(parsedProducts);
    
    if (newProducts.length > 0) {
      setProducts(prev => [...prev, ...newProducts]);
    }
    if (newInventoryItems.length > 0) {
      setInventory(prev => [...prev, ...newInventoryItems]);
    }
    
    return newProducts;
  };
  
  const deleteBranch = async (branchId: string) => {
    await deleteBranchAction(branchId);
    setBranches(prev => prev.filter(b => b.id !== branchId));
    setInventory(prev => prev.filter(i => i.branchId !== branchId));
  };

  const deleteProduct = async (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;

    await deleteProductAction(productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    setInventory(prev => prev.filter(i => i.code !== productToDelete.code));
  };

  const deleteAllProducts = async () => {
    await deleteAllProductsAction();
    setProducts([]);
    setInventory([]);
  };
  
  const updateProduct = async (updatedProduct: Product): Promise<boolean> => {
    try {
        const oldProduct = products.find(p => p.id === updatedProduct.id);
        if (!oldProduct) return false;

        await updateProductAction(updatedProduct);
        await updateInventoryOnProductUpdate(oldProduct.code, updatedProduct);
        
        setProducts(prev => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
        setInventory(prev =>
          prev.map(item =>
            item.code === oldProduct.code
              ? { ...item, code: updatedProduct.code, description: updatedProduct.description }
              : item
          )
        );
        return true;
    } catch (e: any) {
         if (e.message.includes('UNIQUE constraint failed: products.code')) {
            return false;
        }
        throw e;
    }
  };

  const updateInventoryCount = async (itemId: string, physicalCount: number, systemCount: number) => {
    await updateInventoryCountAction(itemId, physicalCount, systemCount);
    setInventory(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, physicalCount, systemCount }
          : item
      )
    );
  };
  
  if (isLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-12 w-12 animate-spin text-primary"><rect width="256" height="256" fill="none"/><path d="M160,216V144a32,32,0,0,0-64,0v72" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M48,88V208a8,8,0,0,0,8,8H200a8,8,0,0,0,8-8V88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M32,120,128,32l96,88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
                <p className="text-muted-foreground">Conectando a la base de datos...</p>
            </div>
        </div>
    );
  }

  if (dbError) {
    return (
        <AppShell>
            <div className="p-4">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Conexión</AlertTitle>
                    <AlertDescription>
                       {dbError}
                    </AlertDescription>
                </Alert>
            </div>
        </AppShell>
    );
  }

  return (
    <AppContext.Provider value={{ branches, products, inventory, addBranch, addProduct, addProductsFromCSV, deleteBranch, deleteProduct, deleteAllProducts, updateProduct, updateInventoryCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
