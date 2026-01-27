'use server';

import { db } from './db';
import type { Branch, Product, InventoryItem } from './types';
import { randomUUID } from 'crypto';

// ====== SETUP ACTION ======
// This function is called if the tables don't exist.
const setup = db.transaction(() => {
    // Run all CREATE TABLE statements in a single transaction.
    db.exec(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        description TEXT NOT NULL,
        physicalCount INTEGER NOT NULL,
        systemCount INTEGER NOT NULL,
        unitType TEXT NOT NULL,
        branchId TEXT NOT NULL,
        FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE
      );
    `);
    console.log("Database setup successful.");
});

function tableExists(tableName: string): boolean {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
    return !!stmt.get(tableName);
}

// ====== FETCH ALL ACTION ======
export async function fetchAllData(): Promise<{ branches: Branch[], products: Product[], inventory: InventoryItem[] }> {
    try {
      console.log('Iniciando la carga de datos desde better-sqlite3...');
      
      // Check if tables exist, if not, set them up.
      if (!tableExists('branches')) {
        console.log('Tables not found, attempting to set up database...');
        setup();
      }
      
      const branches = db.prepare('SELECT * FROM branches;').all() as Branch[];
      const products = db.prepare('SELECT * FROM products;').all() as Product[];
      const inventory = db.prepare('SELECT * FROM inventory;').all() as InventoryItem[];
  
      console.log(`Éxito: Se cargaron ${branches.length} sucursales.`);
      console.log(`Éxito: Se cargaron ${products.length} productos.`);
      console.log(`Éxito: Se cargaron ${inventory.length} items de inventario.`);
  
      return { branches, products, inventory };
    } catch (e: any) {
      console.error('Error fetching data:', e.message);
      throw new Error(`Failed to fetch data: ${e.message}`);
    }
  }

export async function setupDatabase() {
    console.log("Attempting to set up database tables...");
    try {
        setup();
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
  const stmt = db.prepare('INSERT INTO branches (id, name, location) VALUES (?, ?, ?)');
  stmt.run(newBranch.id, newBranch.name, newBranch.location);
  return newBranch;
}

export async function deleteBranch(branchId: string) {
  // better-sqlite3 automatically handles cascading deletes if the foreign key is set up correctly.
  const stmt = db.prepare('DELETE FROM branches WHERE id = ?');
  stmt.run(branchId);
}

// ====== PRODUCT ACTIONS ======
export async function addProduct(data: { code: string; description: string }) {
  const findProductByCode = db.prepare('SELECT id FROM products WHERE code = ?');
  const existingProduct = findProductByCode.get(data.code.toUpperCase());
  if (existingProduct) {
    throw new Error('UNIQUE constraint failed: products.code');
  }

  const branches = db.prepare('SELECT * FROM branches;').all() as Branch[];
  const insertProduct = db.prepare('INSERT INTO products (id, code, description) VALUES (@id, @code, @description)');
  const insertInventory = db.prepare('INSERT INTO inventory (id, code, description, physicalCount, systemCount, unitType, branchId) VALUES (@id, @code, @description, @physicalCount, @systemCount, @unitType, @branchId)');

  let newProduct: Product | null = null;
  const newInventoryItems: InventoryItem[] = [];

  const transaction = db.transaction(() => {
    const product: Product = {
      id: randomUUID(),
      code: data.code.toUpperCase(),
      description: data.description.toUpperCase(),
    };
    insertProduct.run(product);
    newProduct = product;

    for (const branch of branches) {
      const inventoryItem: InventoryItem = {
        id: randomUUID(),
        code: product.code,
        description: product.description,
        physicalCount: 0,
        systemCount: 0,
        unitType: 'units',
        branchId: branch.id,
      };
      insertInventory.run(inventoryItem);
      newInventoryItems.push(inventoryItem);
    }
  });

  transaction();

  if (!newProduct) {
      throw new Error('Failed to create product.');
  }

  return { newProduct, newInventoryItems };
}


export async function addProductsFromCSV(products: { code: string; description: string }[]) {
  if (products.length === 0) return { newProducts: [], newInventoryItems: [] };
  
  const branches = db.prepare('SELECT * FROM branches;').all() as Branch[];
  
  const insertProduct = db.prepare('INSERT INTO products (id, code, description) VALUES (@id, @code, @description)');
  const insertInventory = db.prepare('INSERT INTO inventory (id, code, description, physicalCount, systemCount, unitType, branchId) VALUES (@id, @code, @description, @physicalCount, @systemCount, @unitType, @branchId)');
  const findProductByCode = db.prepare('SELECT id FROM products WHERE code = ?');

  const newProducts: Product[] = [];
  const newInventoryItems: InventoryItem[] = [];

  const transaction = db.transaction((items: { code: string; description: string }[]) => {
    for (const item of items) {
      const productCode = item.code.toUpperCase();
      const productDescription = item.description.toUpperCase();
      
      const existingProduct = findProductByCode.get(productCode);
      
      if (!existingProduct) {
        const newProduct: Product = {
            id: randomUUID(),
            code: productCode,
            description: productDescription
        };
        insertProduct.run(newProduct);
        newProducts.push(newProduct);
        
        if (branches.length > 0) {
          for (const branch of branches) {
            const newInventoryItem: InventoryItem = {
              id: randomUUID(),
              code: newProduct.code,
              description: newProduct.description,
              physicalCount: 0,
              systemCount: 0,
              unitType: 'units',
              branchId: branch.id
            };
            insertInventory.run(newInventoryItem);
            newInventoryItems.push(newInventoryItem);
          }
        }
      }
    }
  });

  transaction(products);
  return { newProducts, newInventoryItems };
}

export async function updateProduct(product: Product) {
  const stmt = db.prepare('UPDATE products SET code = ?, description = ? WHERE id = ?');
  stmt.run(product.code.toUpperCase(), product.description.toUpperCase(), product.id);
}

export async function deleteProduct(productId: string) {
    const getProductStmt = db.prepare('SELECT code FROM products WHERE id = ?');
    const product = getProductStmt.get(productId) as Product | undefined;
    
    if (product) {
        const transaction = db.transaction(() => {
            db.prepare('DELETE FROM products WHERE id = ?').run(productId);
            db.prepare('DELETE FROM inventory WHERE code = ?').run(product.code);
        });
        transaction();
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
    
    const insert = db.prepare('INSERT INTO inventory (id, code, description, physicalCount, systemCount, unitType, branchId) VALUES (?, ?, ?, ?, ?, ?, ?);');
    
    const transaction = db.transaction((items) => {
        for(const item of items) {
            insert.run(item.id, item.code, item.description, item.physicalCount, item.systemCount, item.unitType, item.branchId);
        }
    });

    if (newItems.length > 0) {
        transaction(newItems);
    }
    return newItems;
}

export async function updateInventoryCount(itemId: string, physicalCount: number, systemCount: number) {
  const stmt = db.prepare('UPDATE inventory SET physicalCount = ?, systemCount = ? WHERE id = ?');
  stmt.run(physicalCount, systemCount, itemId);
}

export async function updateInventoryOnProductUpdate(oldCode: string, newProduct: Product) {
    const stmt = db.prepare('UPDATE inventory SET code = ?, description = ? WHERE code = ?;');
    stmt.run(newProduct.code.toUpperCase(), newProduct.description.toUpperCase(), oldCode);
}
