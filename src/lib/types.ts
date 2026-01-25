export type InventoryItem = {
  id: string;
  code: string;
  description: string;
  physicalCount: number;
  systemCount: number;
  unitType: 'units' | 'cases';
  branchId: string;
};

export type Branch = {
  id:string;
  name: string;
};

export type LogEntry = {
  id: string;
  timestamp: Date;
  item: InventoryItem;
  change: string;
};
