'use server';

import { db } from './db';
import type { Branch, Product, InventoryItem } from './types';
import { randomUUID } from 'crypto';

// ====== FETCH ALL ACTION ======
export async function fetchAllData() {
  try {
    console.log("Iniciando la carga de datos desde Turso...");
    
    const [branchesResult, productsResult, inventoryResult] = await db.batch([
      'SELECT * FROM branches;',
      'SELECT * FROM products;',
      'SELECT * FROM inventory;'
    ], 'read');

    const branches = branchesResult.rows as unknown as Branch[];
    const products = productsResult.rows as unknown as Product[];
    const inventory = inventoryResult.rows as unknown as InventoryItem[];

    console.log(`Éxito: Se cargaron ${branches.length} sucursales.`);
    console.log(`Éxito: Se cargaron ${products.length} productos.`);
    console.log(`Éxito: Se cargaron ${inventory.length} items de inventario.`);

    return { branches, products, inventory };
  } catch (e: any) {
    console.error('Error fetching data:', e.message);
    if (e.message.includes('no such table')) {
      console.log('Tables not found, attempting to set up database...');
      await setupDatabase();
      // Retry fetching
      return await fetchAllData();
    }
    throw new Error(`Failed to fetch data: ${e.message}`);
  }
}

// ====== SETUP ACTION ======
export async function setupDatabase() {
    console.log("Attempting to set up database tables...");
    try {
      const tx = await db.transaction("write");
      try {
        await tx.batch([
          `CREATE TABLE IF NOT EXISTS branches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT NOT NULL
          );`,
          `CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL
          );`,
          `CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            description TEXT NOT NULL,
            physicalCount INTEGER NOT NULL,
            systemCount INTEGER NOT NULL,
            unitType TEXT NOT NULL,
            branchId TEXT NOT NULL,
            FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE
          );`,
        ]);
        await tx.commit();
        console.log("Database setup successful.");
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (e: any) {
      console.error('Error setting up database:', e.message);
      throw new Error(`Failed to set up database: ${e.message}`);
    }
  }

// ====== BRANCH ACTIONS ======
export async function addBranch(data: { name: string; location: string }) {
  const newBranch = { 
    id: randomUUID(), 
    name: data.name.toUpperCase(), 
    location: data.location.toUpperCase() 
  };
  await db.execute({
    sql: 'INSERT INTO branches (id, name, location) VALUES (?, ?, ?);',
    args: [newBranch.id, newBranch.name, newBranch.location],
  });
  return newBranch;
}

export async function deleteBranch(branchId: string) {
  await db.execute({
    sql: 'DELETE FROM branches WHERE id = ?;',
    args: [branchId],
  });
}

// ====== PRODUCT ACTIONS ======
export async function addProduct(data: { code: string; description: string }) {
  const id = randomUUID();
  const newProduct = {
    id,
    code: data.code.toUpperCase(),
    description: data.description.toUpperCase()
  };
  await db.execute({
    sql: 'INSERT INTO products (id, code, description) VALUES (?, ?, ?);',
    args: [newProduct.id, newProduct.code, newProduct.description],
  });
  return newProduct;
}

export async function addProductsFromCSV(products: { code: string; description: string }[]) {
  if (products.length === 0) return [];
  
  const stmts = products.map(p => ({
    sql: 'INSERT INTO products (id, code, description) VALUES (?, ?, ?) ON CONFLICT(code) DO NOTHING;',
    args: [randomUUID(), p.code.toUpperCase(), p.description.toUpperCase()],
  }));

  await db.batch(stmts);
  return products;
}

export async function updateProduct(product: Product) {
  await db.execute({
    sql: 'UPDATE products SET code = ?, description = ? WHERE id = ?;',
    args: [product.code.toUpperCase(), product.description.toUpperCase(), product.id],
  });
}

export async function deleteProduct(productId: string) {
    const productResult = await db.execute({ sql: 'SELECT code FROM products WHERE id = ?', args: [productId] });
    if (productResult.rows.length > 0) {
        const productCode = productResult.rows[0].code as string;
        await db.batch([
            { sql: 'DELETE FROM products WHERE id = ?;', args: [productId] },
            { sql: 'DELETE FROM inventory WHERE code = ?;', args: [productCode] }
        ]);
    }
}

// ====== INVENTORY ACTIONS ======
export async function createInventoryForNewBranch(branchId: string, products: Product[]): Promise<InventoryItem[]> {
    if (products.length === 0) return [];

    const newItems: InventoryItem[] = products.map(p => ({
        id: randomUUID(),
        code: p.code,
        description: p.description,
        physicalCount: 0,
        systemCount: 0,
        unitType: 'units',
        branchId,
    }));
    
    const stmts = newItems.map(item => ({
        sql: 'INSERT INTO inventory (id, code, description, physicalCount, systemCount, unitType, branchId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        args: [item.id, item.code, item.description, item.physicalCount, item.systemCount, item.unitType, item.branchId]
    }));

    if (stmts.length > 0) {
      await db.batch(stmts);
    }
    return newItems;
}

export async function createInventoryForNewProduct(product: Product, branches: Branch[]): Promise<InventoryItem[]> {
    if (branches.length === 0) return [];
    
    const newItems: InventoryItem[] = branches.map(b => ({
        id: randomUUID(),
        code: product.code,
        description: product.description,
        physicalCount: 0,
        systemCount: 0,
        unitType: 'units',
        branchId: b.id,
    }));

    const stmts = newItems.map(item => ({
        sql: 'INSERT INTO inventory (id, code, description, physicalCount, systemCount, unitType, branchId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        args: [item.id, item.code, item.description, item.physicalCount, item.systemCount, item.unitType, item.branchId]
    }));

    if (stmts.length > 0) {
      await db.batch(stmts);
    }
    return newItems;
}

export async function updateInventoryCount(itemId: string, physicalCount: number, systemCount: number) {
  await db.execute({
    sql: 'UPDATE inventory SET physicalCount = ?, systemCount = ? WHERE id = ?;',
    args: [physicalCount, systemCount, itemId],
  });
}

export async function updateInventoryOnProductUpdate(oldCode: string, newProduct: Product) {
    await db.execute({
        sql: 'UPDATE inventory SET code = ?, description = ? WHERE code = ?;',
        args: [newProduct.code.toUpperCase(), newProduct.description.toUpperCase(), oldCode],
    });
}
