import { DailyControlPage } from '@/components/daily-control-page';
import { branches, inventoryItems } from '@/lib/mock-data';

export default function ControlDiario() {
  return <DailyControlPage initialBranches={branches} initialInventory={inventoryItems} />;
}
