'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';

function capitalizeFirstLetter(string: string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function PageHeader({ title }: { title: string }) {
  const [today, setToday] = useState('');

  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    setToday(capitalizeFirstLetter(formattedDate));
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      <div className="hidden md:flex items-center space-x-2">
        <ThemeToggle />
        <Badge variant="outline" className="h-10 items-center">
          <Calendar className="mr-2 h-4 w-4" />
          {today ? <span>{today}</span> : <div className="w-32 h-4 bg-muted animate-pulse rounded-md" />}
        </Badge>
      </div>
    </div>
  );
}
