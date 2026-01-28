export type InventoryItem = {
  id: string;
  code: string;
  description: string;
  physicalCount: number;
  systemCount: number;
  unitType: 'units' | 'cases';
  branchId: string;
  lastUpdated: string | null;
};

export type Branch = {
  id:string;
  name: string;
  location: string;
};

export type LogEntry = {
  id: string;
  timestamp: Date;
  item: InventoryItem;
  change: string;
};

export type Product = {
  id: string;
  code: string;
  description: string;
};
