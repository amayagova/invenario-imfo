'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Store,
  Box,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';

export default function DashboardPage() {
  const { branches, products, inventory } = useAppContext();

  const productCount = products.length;
  const branchCount = branches.length;
  const discrepancies = inventory.filter(
    (item) => item.physicalCount !== item.systemCount
  ).length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader title="Vista General" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SUCURSALES</CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRODUCTOS</CardTitle>
            <Box className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              DIFERENCIAS HOY
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discrepancies}</div>
          </CardContent>
        </Card>
      </div>
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Estado Actual por Sucursal</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">
              {branches.length === 0 ? "Sin sucursales registradas" : "Gráfico de estado próximamente."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
