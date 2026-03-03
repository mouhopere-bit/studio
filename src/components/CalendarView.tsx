
'use client';

import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProductionEntry } from '@/lib/db';

interface CalendarViewProps {
  entries: ProductionEntry[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export function CalendarView({ entries, onSelectDate, selectedDate }: CalendarViewProps) {
  // Get unique dates that have entries
  const datesWithData = React.useMemo(() => {
    const dates = new Set(entries.map(e => e.date));
    return Array.from(dates).map(d => new Date(d));
  }, [entries]);

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-xl font-headline flex items-center justify-between">
          Calendrier de Production
          <span className="text-sm font-normal opacity-80">
            {format(selectedDate, 'MMMM yyyy', { locale: fr })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          locale={fr}
          className="rounded-md border-none"
          modifiers={{
            hasData: datesWithData
          }}
          modifiersStyles={{
            hasData: {
              fontWeight: 'bold',
              textDecoration: 'underline',
              color: 'hsl(var(--primary))',
              backgroundColor: 'hsl(var(--primary) / 0.1)'
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
