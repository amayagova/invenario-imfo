import type { Branch, InventoryItem } from '@/lib/types';

export const branches: Branch[] = [
  { id: 'branch-1', name: 'Almacén Principal' },
  { id: 'branch-2', name: 'Tienda Central' },
  { id: 'branch-3', name: 'Tienda Oeste' },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: 'item-1',
    code: 'SKU-001',
    description: 'Granos de Café Premium',
    physicalCount: 95,
    systemCount: 100,
    unitType: 'cases',
    branchId: 'branch-1',
  },
  {
    id: 'item-2',
    code: 'SKU-002',
    description: 'Té Verde Orgánico',
    physicalCount: 250,
    systemCount: 250,
    unitType: 'units',
    branchId: 'branch-2',
  },
  {
    id: 'item-3',
    code: 'SKU-003',
    description: 'Barra de Chocolate Artesanal',
    physicalCount: 480,
    systemCount: 500,
    unitType: 'units',
    branchId: 'branch-1',
  },
  {
    id: 'item-4',
    code: 'SKU-004',
    description: 'Paquete de 12 Aguas Minerales',
    physicalCount: 75,
    systemCount: 75,
    unitType: 'cases',
    branchId: 'branch-3',
  },
  {
    id: 'item-5',
    code: 'SKU-005',
    description: 'Croissants Frescos',
    physicalCount: 118,
    systemCount: 120,
    unitType: 'units',
    branchId: 'branch-2',
  },
];
