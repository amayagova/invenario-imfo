import type { Branch, InventoryItem } from '@/lib/types';

export const branches: Branch[] = [
  { id: 'branch-1', name: 'Main Warehouse' },
  { id: 'branch-2', name: 'Downtown Store' },
  { id: 'branch-3', name: 'Westside Outlet' },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: 'item-1',
    code: 'SKU-001',
    description: 'Premium Coffee Beans',
    physicalCount: 95,
    systemCount: 100,
    unitType: 'cases',
    branchId: 'branch-1',
  },
  {
    id: 'item-2',
    code: 'SKU-002',
    description: 'Organic Green Tea',
    physicalCount: 250,
    systemCount: 250,
    unitType: 'units',
    branchId: 'branch-2',
  },
  {
    id: 'item-3',
    code: 'SKU-003',
    description: 'Artisan Chocolate Bar',
    physicalCount: 480,
    systemCount: 500,
    unitType: 'units',
    branchId: 'branch-1',
  },
  {
    id: 'item-4',
    code: 'SKU-004',
    description: 'Mineral Water 12-pack',
    physicalCount: 75,
    systemCount: 75,
    unitType: 'cases',
    branchId: 'branch-3',
  },
  {
    id: 'item-5',
    code: 'SKU-005',
    description: 'Fresh Croissants',
    physicalCount: 118,
    systemCount: 120,
    unitType: 'units',
    branchId: 'branch-2',
  },
];
