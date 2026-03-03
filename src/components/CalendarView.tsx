
'use client';

import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProductionEntry } from '@/lib/db';

interface CalendarViewProps {
  entries: ProductionEntry[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export function CalendarView({ entries, onSelectDate, selectedDate }: CalendarViewProps) {
  const datesWithData = React.useMemo(() => {
    const dates = new Set(entries.map(e => e.date));
    return Array.from(dates).map(d => new Date(d));
  }, [entries]);

  return (
    <Card className="shadow-none border-none bg-transparent">
      <CardContent className="p-0 flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          locale={fr}
          className="rounded-md border-none p-0 scale-95 md:scale-100 origin-top"
          modifiers={{
            hasData: datesWithData
          }}
          modifiersStyles={{
            hasData: {
              fontWeight: '900',
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
