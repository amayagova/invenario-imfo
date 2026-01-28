'use client';

import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Download, BarChart2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';

export function ReportsPage() {
  const { branches, inventory, products } = useAppContext();
  const [selectedBranch, setSelectedBranch] = React.useState<string>('all');
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const totalDiscrepancyValue = 0; // Placeholder
  const positiveDiscrepancy = 0; // Placeholder
  const negativeDiscrepancy = 0; // Placeholder


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader title="Reportes" />

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full sm:w-auto">
                    <h3 className="text-lg font-medium text-foreground">Filtros</h3>
                    <p className="text-sm text-muted-foreground">
                        Selecciona sucursal y rango de fechas.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Seleccionar sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Sucursales</SelectItem>
                            {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={'outline'}
                            className={cn(
                            'w-full sm:w-[280px] justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, 'LLL dd, y', {locale: es})} -{' '}
                                {format(date.to, 'LLL dd, y', {locale: es})}
                                </>
                            ) : (
                                format(date.from, 'LLL dd, y', {locale: es})
                            )
                            ) : (
                            <span>Seleccionar fecha</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                            locale={es}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                 <Button disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Reporte
                </Button>
            </div>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              VALOR TOTAL DIFERENCIA
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDiscrepancyValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor monetario de las discrepancias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOBRANTE (Uds.)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{positiveDiscrepancy}</div>
            <p className="text-xs text-muted-foreground">
              Unidades físicas por encima del sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FALTANTE (Uds.)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{negativeDiscrepancy}</div>
            <p className="text-xs text-muted-foreground">
              Unidades físicas por debajo del sistema
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Productos con Diferencias</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <div className="flex h-80 items-center justify-center">
                <p className="text-muted-foreground">
                    Gráfico de productos próximamente.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
