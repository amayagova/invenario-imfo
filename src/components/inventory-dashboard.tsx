'use client';

import * as React from 'react';
import {
  Boxes,
  History,
  Import,
  Package,
  PlusCircle,
  Warehouse,
} from 'lucide-react';
import type { Branch, InventoryItem, LogEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AddInventoryForm } from './add-inventory-form';
import { ImportProductsForm } from './import-products-form';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type InventoryDashboardProps = {
  initialInventory: InventoryItem[];
  branches: Branch[];
};

export function InventoryDashboard({
  initialInventory,
  branches,
}: InventoryDashboardProps) {
  const [inventory, setInventory] =
    React.useState<InventoryItem[]>(initialInventory);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<string>('all');
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const handleAddItem = (newItem: InventoryItem) => {
    setInventory((prev) => [newItem, ...prev]);
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      item: newItem,
      change: 'Nuevo artículo añadido',
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleImportItems = (newItems: InventoryItem[]) => {
    setInventory((prev) => [...newItems, ...prev]);

    const newLogs: LogEntry[] = newItems.map((item) => ({
      id: `log-${Date.now()}-${item.id}`,
      timestamp: new Date(),
      item: item,
      change: 'Artículo importado',
    }));
    setLogs((prev) => [...newLogs, ...prev]);

    toast({
      title: '¡Éxito!',
      description: `${newItems.length} artículo(s) importado(s) con éxito.`,
    });
  };

  const filteredInventory = React.useMemo(() => {
    if (selectedBranch === 'all') {
      return inventory;
    }
    return inventory.filter((item) => item.branchId === selectedBranch);
  }, [inventory, selectedBranch]);

  const getBranchName = (branchId: string) => {
    return (
      branches.find((b) => b.id === branchId)?.name ?? 'Sucursal Desconocida'
    );
  };

  const DiscrepancyCell = ({ item }: { item: InventoryItem }) => {
    const discrepancy = item.physicalCount - item.systemCount;
    const color =
      discrepancy < 0
        ? 'text-destructive'
        : discrepancy > 0
        ? 'text-amber-600'
        : 'text-emerald-600';
    return <span className={cn('font-medium', color)}>{discrepancy}</span>;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">InfoStock</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                <SelectValue placeholder="Seleccionar Sucursal" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Import className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Artículo
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Inventario</CardTitle>
            <CardDescription>
              Sigue, gestiona y audita tu inventario en todas las sucursales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="inventory">
              <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="inventory">
                  <Boxes className="mr-2 h-4 w-4" />
                  Inventario
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <History className="mr-2 h-4 w-4" />
                  Registro de Actividad
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inventory" className="mt-4">
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-center">
                          Tipo de Unidad
                        </TableHead>
                        <TableHead className="text-right">Sistema</TableHead>
                        <TableHead className="text-right">Físico</TableHead>
                        <TableHead className="text-right">Discrepancia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.length > 0 ? (
                        filteredInventory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.code}
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {item.unitType === 'cases'
                                  ? 'Cajas'
                                  : 'Unidades'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.systemCount}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.physicalCount}
                            </TableCell>
                            <TableCell className="text-right">
                              <DiscrepancyCell item={item} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">
                            No se encontraron artículos en el inventario.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="logs" className="mt-4">
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Artículo</TableHead>
                        <TableHead>Sucursal</TableHead>
                        <TableHead>Cambio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {log.timestamp.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {log.item.description} ({log.item.code})
                            </TableCell>
                            <TableCell>
                              {getBranchName(log.item.branchId)}
                            </TableCell>
                            <TableCell>{log.change}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Aún no se ha registrado actividad.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Artículo de Inventario</DialogTitle>
          </DialogHeader>
          <AddInventoryForm
            branches={branches}
            onAddItem={handleAddItem}
            onFinished={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar Productos</DialogTitle>
            <DialogDescription>
              Pega una lista de productos en formato CSV (código,descripción).
              Cada producto en una nueva línea.
            </DialogDescription>
          </DialogHeader>
          <ImportProductsForm
            branches={branches}
            onImportItems={handleImportItems}
            onFinished={() => setImportDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
