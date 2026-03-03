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
    // Utiliser Set pour l'unicité des dates
    const dates = new Set(entries.map(e => e.productionDayId || e.date));
    return Array.from(dates)
      .filter(d => !!d)
      .map(d => {
        // Créer une date locale sans décalage horaire
        const [year, month, day] = (d as string).split('-').map(Number);
        return new Date(year, month - 1, day);
      });
  }, [entries]);

  return (
    <Card className="shadow-none border-none bg-white rounded-2xl overflow-hidden ring-1 ring-slate-200">
      <CardContent className="p-0 flex justify-center">
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
              textDecoration: 'underline',
              textDecorationColor: 'hsl(var(--primary) / 0.5)',
              textUnderlineOffset: '4px'
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
