'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Branch, Product, InventoryItem } from '@/lib/types';

interface AppContextType {
  branches: Branch[];
  products: Product[];
  inventory: InventoryItem[];
  addBranch: (branch: { name: string; location: string }) => void;
  addProduct: (product: { code: string; description: string }) => Product | null;
  addProductsFromCSV: (parsedProducts: {code: string, description: string}[]) => Product[];
  deleteBranch: (branchId: string) => void;
  deleteProduct: (productId: string) => void;
  updateProduct: (product: Product) => boolean;
  updateInventoryCount: (itemId: string, newCount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const addBranch = (newBranchData: { name: string; location: string }) => {
    setBranches(prevBranches => {
        const newBranch: Branch = {
            id: `branch-${Date.now()}`,
            name: newBranchData.name.toUpperCase(),
            location: newBranchData.location.toUpperCase(),
        };
        const updatedBranches = [newBranch, ...prevBranches];

        setInventory(prevInventory => {
            const newInventoryItems = products.map(product => ({
                id: `item-${Date.now()}-${newBranch.id}-${product.code}`,
                code: product.code,
                description: product.description,
                physicalCount: 0,
                systemCount: 0,
                unitType: 'units' as 'units',
                branchId: newBranch.id,
            }));
            return [...prevInventory, ...newInventoryItems];
        });
        
        return updatedBranches;
    });
  };

  const addProduct = (newProductData: { code: string; description: string }): Product | null => {
    let newProduct: Product | null = null;
    let productExists = false;

    setProducts(prevProducts => {
        if (prevProducts.some(p => p.code === newProductData.code.toUpperCase())) {
            productExists = true;
            return prevProducts;
        }
        
        newProduct = {
            id: `product-${Date.now()}`,
            code: newProductData.code.toUpperCase(),
            description: newProductData.description.toUpperCase()
        };
        const updatedProducts = [newProduct, ...prevProducts];

        setInventory(prevInventory => {
            const newInventoryItems = branches.map(branch => ({
                id: `item-${Date.now()}-${branch.id}-${newProduct!.code}`,
                code: newProduct!.code,
                description: newProduct!.description,
                physicalCount: 0,
                systemCount: 0,
                unitType: 'units' as 'units',
                branchId: branch.id,
            }));
            return [...prevInventory, ...newInventoryItems];
        });

        return updatedProducts;
    });
    
    return productExists ? null : newProduct;
  };
  
    const addProductsFromCSV = (parsedProducts: {code: string, description: string}[]): Product[] => {
        let addedProducts: Product[] = [];
        setProducts(prevProducts => {
            const existingCodes = new Set(prevProducts.map(p => p.code));
            const productsToAdd = parsedProducts.filter(p => p.code && p.description && !existingCodes.has(p.code.toUpperCase()));

            if (productsToAdd.length === 0) {
                return prevProducts;
            }

            const newProducts: Product[] = productsToAdd.map((p, index) => ({
                id: `product-${Date.now()}-${index}`,
                code: p.code.toUpperCase(),
                description: p.description.toUpperCase()
            }));
            
            addedProducts = newProducts;

            setInventory(prevInventory => {
                const newInventoryItems = newProducts.flatMap(product => 
                    branches.map(branch => ({
                        id: `item-${Date.now()}-${branch.id}-${product.code}`,
                        code: product.code,
                        description: product.description,
                        physicalCount: 0,
                        systemCount: 0,
                        unitType: 'units' as 'units',
                        branchId: branch.id,
                    }))
                );
                return [...prevInventory, ...newInventoryItems];
            });

            return [...addedProducts, ...prevProducts];
        });
        return addedProducts;
    };
    
    const updateProduct = (updatedProduct: Product): boolean => {
        let success = true;
        setProducts(prevProducts => {
            const codeExists = prevProducts.some(p => p.code === updatedProduct.code && p.id !== updatedProduct.id);
            if (codeExists) {
                success = false;
                return prevProducts;
            }

            const oldProduct = prevProducts.find(p => p.id === updatedProduct.id);
            if (oldProduct) {
                 setInventory(prevInventory =>
                    prevInventory.map(item =>
                        item.code === oldProduct.code
                            ? { ...item, code: updatedProduct.code, description: updatedProduct.description }
                            : item
                    )
                );
            }
            return prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        });
        return success;
    }
    
    const deleteBranch = (branchId: string) => {
        setBranches(prev => prev.filter(branch => branch.id !== branchId));
        setInventory(prev => prev.filter(item => item.branchId !== branchId));
    };

    const deleteProduct = (productId: string) => {
        setProducts(prevProducts => {
            const productToDelete = prevProducts.find(p => p.id === productId);
            if (!productToDelete) return prevProducts;
            
            setInventory(prev => prev.filter(item => item.code !== productToDelete.code));
            return prevProducts.filter(p => p.id !== productId);
        });
    };
    
    const updateInventoryCount = (itemId: string, newCount: number) => {
        setInventory(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, physicalCount: newCount }
              : item
          )
        );
    };

  return (
    <AppContext.Provider value={{ branches, products, inventory, addBranch, addProduct, addProductsFromCSV, deleteBranch, deleteProduct, updateProduct, updateInventoryCount }}>
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
