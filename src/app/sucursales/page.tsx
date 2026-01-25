import { BranchesPage } from '@/components/branches-page';
import { branches } from '@/lib/mock-data';

export default function Sucursales() {
  return <BranchesPage initialBranches={branches} />;
}
