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
  Sun,
  Calendar,
} from 'lucide-react';
import { branches, inventoryItems } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const uniqueProducts = new Set(inventoryItems.map((item) => item.code));
  const productCount = uniqueProducts.size;
  const branchCount = branches.length;
  const discrepancies = inventoryItems.filter(
    (item) => item.physicalCount !== item.systemCount
  ).length;

  const today = 'domingo, 25 de enero';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Vista General</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <Sun className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="h-10 items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{today}</span>
          </Badge>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SUCURSALES</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PRODUCTOS</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
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
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
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
              Sin sucursales registradas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}