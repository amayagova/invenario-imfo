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
    batchUpdateInventoryFromCSV,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

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
  batchUpdateInventory: (updates: { code: string; physicalCount: number; systemCount: number; branchId: string }[]) => Promise<void>;
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

  const addBranch = useCallback(async (newBranchData: { name: string; location: string }) => {
    const formattedData = {
      name: newBranchData.name.toUpperCase(),
      location: newBranchData.location.toUpperCase(),
    };
    const newBranchWithId = await addBranchAction(formattedData);
    const newInventoryItems = await createInventoryForNewBranch(newBranchWithId.id, products);
    
    setBranches(prev => [...prev, newBranchWithId]);
    if (newInventoryItems.length > 0) {
      setInventory(prev => [...prev, ...newInventoryItems]);
    }
  }, [products]);
  
  const addProduct = useCallback(async (newProductData: { code: string; description: string }): Promise<Product | null> => {
     try {
        const formattedData = {
            code: newProductData.code.toUpperCase(),
            description: newProductData.description.toUpperCase(),
        };
        const { newProduct, newInventoryItems } = await addProductAction(formattedData);
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
  }, []);

  const addProductsFromCSV = useCallback(async (parsedProducts: { code: string; description: string }[]): Promise<Product[]> => {
    const formattedProducts = parsedProducts.map(p => ({
        code: p.code.toUpperCase(),
        description: p.description.toUpperCase()
    }));
    const { newProducts, newInventoryItems } = await addProductsFromCSVAction(formattedProducts);
    
    if (newProducts.length > 0) {
      setProducts(prev => [...prev, ...newProducts]);
    }
    if (newInventoryItems.length > 0) {
      setInventory(prev => [...prev, ...newInventoryItems]);
    }
    
    return newProducts;
  }, []);
  
  const deleteBranch = useCallback(async (branchId: string) => {
    await deleteBranchAction(branchId);
    setBranches(prev => prev.filter(b => b.id !== branchId));
    setInventory(prev => prev.filter(i => i.branchId !== branchId));
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;

    await deleteProductAction(productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    setInventory(prev => prev.filter(i => i.code !== productToDelete.code));
  }, [products]);

  const deleteAllProducts = useCallback(async () => {
    await deleteAllProductsAction();
    setProducts([]);
    setInventory([]);
  }, []);
  
  const updateProduct = useCallback(async (updatedProductData: Product): Promise<boolean> => {
    try {
        const oldProduct = products.find(p => p.id === updatedProductData.id);
        if (!oldProduct) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'El producto que intentas editar ya no existe.',
            });
            return false;
        }

        const updatedProduct = {
          ...updatedProductData,
          code: updatedProductData.code.toUpperCase(),
          description: updatedProductData.description.toUpperCase()
        };

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
        toast({
            variant: 'destructive',
            title: 'Error al actualizar',
            description: e.message.includes('UNIQUE constraint failed') 
              ? 'Ya existe otro producto con ese código.'
              : e.message || 'Ocurrió un error inesperado.'
         });
        return false;
    }
  }, [products, toast]);

  const updateInventoryCount = useCallback(async (itemId: string, physicalCount: number, systemCount: number) => {
    const updatedItem = await updateInventoryCountAction(itemId, physicalCount, systemCount);
    setInventory(prev =>
      prev.map(item =>
        item.id === itemId
          ? updatedItem
          : item
      )
    );
  }, []);
  
  const batchUpdateInventory = useCallback(async (updates: { code: string; physicalCount: number; systemCount: number; branchId: string }[]) => {
    const updatedItems = await batchUpdateInventoryFromCSV(updates);

    if (updatedItems.length > 0) {
      const updatedItemMap = new Map(updatedItems.map(item => [item.id, item]));
      setInventory(prevInventory => 
        prevInventory.map(item => updatedItemMap.get(item.id) || item)
      );
    }
  }, []);

  if (isLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-12 w-12 text-primary animate-spin"><rect width="256" height="256" fill="none"/><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm-8,152H48V64H208V192Z" fill="var(--sidebar-primary)"/><path d="M128,104a24,24,0,1,0,24,24A24,24,0,0,0,128,104Zm0,40a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z" fill="var(--sidebar-primary)"/><path d="M176,112a8,8,0,1,0,8,8A8,8,0,0,0,176,112Z" fill="var(--sidebar-primary)"/><path d="M64,168H96a8,8,0,0,0,0-16H64a8,8,0,0,0,0,16Z" fill="var(--sidebar-primary)"/></svg>
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

  const contextValue = {
    branches,
    products,
    inventory,
    addBranch,
    addProduct,
    addProductsFromCSV,
    deleteBranch,
    deleteProduct,
    deleteAllProducts,
    updateProduct,
    updateInventoryCount,
    batchUpdateInventory,
  };

  return (
    <AppContext.Provider value={contextValue}>
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
