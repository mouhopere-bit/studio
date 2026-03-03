'use client';

import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="shadow-none border-none bg-white rounded-xl overflow-hidden ring-1 ring-slate-200">
      <CardContent className="p-2 flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          locale={fr}
          className="p-0"
          modifiers={{
            hasData: datesWithData
          }}
          modifiersStyles={{
            hasData: {
              fontWeight: '900',
              color: 'hsl(var(--primary))',
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              borderRadius: '50%',
              boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.2)'
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
