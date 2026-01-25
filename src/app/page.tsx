import { InventoryDashboard } from '@/components/inventory-dashboard';
import { branches, inventoryItems } from '@/lib/mock-data';

export default function Home() {
  return (
    <main>
      <InventoryDashboard initialInventory={inventoryItems} branches={branches} />
    </main>
  );
}
