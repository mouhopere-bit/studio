'use client';

import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { fr } from 'date-fns/locale';

interface CalendarViewProps {
  entries: any[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export function CalendarView({ entries, onSelectDate, selectedDate }: CalendarViewProps) {
  // Extraire les dates uniques des entrées (format YYYY-MM-DD)
  const datesWithData = React.useMemo(() => {
    if (!entries) return [];
    // Dans Firestore, les dates sont souvent stockées en string ISO ou date simple
    const dates = new Set(entries.map(e => e.productionDayId || e.date));
    return Array.from(dates)
      .filter(d => !!d)
      .map(d => new Date(d as string));
  }, [entries]);

  return (
    <Card className="shadow-none border-none bg-white rounded-2xl overflow-hidden ring-1 ring-slate-200">
      <CardContent className="p-1 flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          locale={fr}
          className="p-1"
          modifiers={{
            hasData: datesWithData
          }}
          modifiersStyles={{
            hasData: {
              fontWeight: 'bold',
              color: 'hsl(var(--primary))',
              backgroundColor: 'hsl(var(--primary) / 0.08)',
              borderRadius: '9999px',
              border: '1px solid hsl(var(--primary) / 0.1)'
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
