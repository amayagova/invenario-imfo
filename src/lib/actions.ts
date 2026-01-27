'use server';

import { db } from './db';
import type { Branch, Product, InventoryItem } from './types';
import { randomUUID } from 'crypto';

// ====== FETCH ALL ACTION ======
export async function fetchAllData() {
  try {
    // Force synchronization with the primary database to avoid read-after-write issues.
    await db.sync();

    const branchesResult = await db.execute('SELECT * FROM branches;');
    const productsResult = await db.execute('SELECT * FROM products;');
    const inventoryResult = await db.execute('SELECT * FROM inventory;');

    const branches = branchesResult.rows as unknown as Branch[];
    const products = productsResult.rows as unknown as Product[];
    const inventory = inventoryResult.rows as unknown as InventoryItem[];

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
  const id = randomUUID();
  await db.execute({
    sql: 'INSERT INTO branches (id, name, location) VALUES (?, ?, ?);',
    args: [id, data.name.toUpperCase(), data.location.toUpperCase()],
  });
  return { id, ...data };
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
export async function createInventoryForNewBranch(branchId: string, products: Product[]) {
    if (products.length === 0) return;
    const stmts = products.map(p => ({
        sql: 'INSERT INTO inventory (id, code, description, physicalCount, systemCount, unitType, branchId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        args: [randomUUID(), p.code, p.description, 0, 0, 'units', branchId]
    }));
    await db.batch(stmts);
}

export async function createInventoryForNewProduct(product: Product, branches: Branch[]) {
    if (branches.length === 0) return;
    const stmts = branches.map(b => ({
        sql: 'INSERT INTO inventory (id, code, description, physicalCount, systemCount, unitType, branchId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        args: [randomUUID(), product.code, product.description, 0, 0, 'units', b.id]
    }));
    await db.batch(stmts);
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
        args: [newProduct.code, newProduct.description, oldCode],
    });
}
