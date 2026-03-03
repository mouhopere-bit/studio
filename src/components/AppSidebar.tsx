
'use client';

import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup, 
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { CalendarView } from '@/components/CalendarView';
import { ProductionEntry } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LayoutDashboard, Database } from 'lucide-react';

interface AppSidebarProps {
  entries: ProductionEntry[];
  allEntries: ProductionEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function AppSidebar({ entries, allEntries, selectedDate, onSelectDate }: AppSidebarProps) {
  const totals = React.useMemo(() => {
    return entries.reduce((acc, curr) => {
      if (curr.type === 'Ciment') acc.ciment += curr.quantity;
      if (curr.type === 'Adjuvant') acc.adjuvant += curr.quantity;
      if (curr.type === 'Gravier') {
        if (curr.gravelSize === '3/8') acc.g38 += curr.quantity;
        if (curr.gravelSize === '8/16') acc.g816 += curr.quantity;
        if (curr.gravelSize === '0/3') acc.g03 += curr.quantity;
      }
      acc.grandTotal += curr.quantity;
      return acc;
    }, { ciment: 0, adjuvant: 0, g38: 0, g816: 0, g03: 0, grandTotal: 0 });
  }, [entries]);

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="p-4 bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Axiome</h2>
            <p className="text-xs opacity-80">Central à Béton</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-2">
            Navigation Temporelle
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <CalendarView 
              entries={allEntries} 
              selectedDate={selectedDate} 
              onSelectDate={onSelectDate} 
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-2">
            Vue d'ensemble du jour
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="border-none shadow-md overflow-hidden bg-slate-50">
              <CardHeader className="p-3 border-b bg-slate-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 uppercase tracking-tight">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  Résumé du Jour
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Total Général</span>
                  <span className="text-2xl font-black text-primary">{totals.grandTotal.toFixed(2)} <span className="text-xs font-medium text-muted-foreground italic">Tonnes</span></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 rounded shadow-sm border border-blue-100">
                    <p className="text-[10px] text-blue-800 font-black uppercase">Ciment</p>
                    <p className="text-lg font-bold text-blue-900">{totals.ciment.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded shadow-sm border border-purple-100">
                    <p className="text-[10px] text-purple-800 font-black uppercase">Adjuvant</p>
                    <p className="text-lg font-bold text-purple-900">{totals.adjuvant.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
