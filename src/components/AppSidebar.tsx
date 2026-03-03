'use client';

import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup, 
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter
} from '@/components/ui/sidebar';
import { CalendarView } from '@/components/CalendarView';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LayoutDashboard, Database, User as UserIcon, LogOut } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';

const AxiomeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
    <path d="M21 21V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14" />
    <path d="M3 10h18" />
    <path d="M10 5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
  </svg>
);

interface AppSidebarProps {
  entries: any[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  targetUid: string;
}

export function AppSidebar({ entries, selectedDate, onSelectDate, targetUid }: AppSidebarProps) {
  const { user } = useUser();
  const auth = useAuth();

  const totals = React.useMemo(() => {
    return entries.reduce((acc, curr) => {
      if (curr.type === 'Ciment') {
        acc.ciment += curr.quantity;
        acc.totalPoids += curr.quantity;
      }
      if (curr.type === 'Adjuvant') {
        acc.adjuvant += curr.quantity;
        acc.totalAdjuvant += curr.quantity;
      }
      if (curr.type === 'Gravier') {
        if (curr.gravelSize === '3/8') acc.g38 += curr.quantity;
        if (curr.gravelSize === '8/16') acc.g816 += curr.quantity;
        if (curr.gravelSize === '0/3') acc.g03 += curr.quantity;
        acc.totalPoids += curr.quantity;
      }
      return acc;
    }, { ciment: 0, adjuvant: 0, g38: 0, g816: 0, g03: 0, totalPoids: 0, totalAdjuvant: 0 });
  }, [entries]);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarHeader className="p-6 bg-primary text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <AxiomeLogo className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-lg">Axiome Cloud</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Centrale à Béton</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 font-bold uppercase text-[10px] mb-2 tracking-widest">
            Calendrier de Production
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <CalendarView 
              entries={entries || []} 
              selectedDate={selectedDate} 
              onSelectDate={onSelectDate} 
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 font-bold uppercase text-[10px] mb-2 tracking-widest">
            Récapitulatif du jour
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="border shadow-sm bg-slate-50/50 rounded-2xl overflow-hidden">
              <CardHeader className="p-4 border-b bg-white/50">
                <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-tight text-slate-600">
                  <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                  Statistiques Journalières
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Poids Total</span>
                  <span className="text-2xl font-black text-primary">
                    {totals.totalPoids.toFixed(1)} <span className="text-[10px] font-medium text-slate-400 italic">Tonnes</span>
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Ciment</p>
                    <p className="text-sm font-bold text-slate-800">{totals.ciment.toFixed(1)} T</p>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Adjuvant</p>
                    <p className="text-sm font-bold text-slate-800">{totals.adjuvant.toFixed(1)} L</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-slate-50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border shadow-sm">
            <div className="bg-primary/10 p-2 rounded-full">
              <UserIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Utilisateur</p>
              <p className="text-[11px] font-mono truncate text-slate-600">
                {user?.isAnonymous ? 'Visiteur' : user?.email || user?.uid.substring(0, 8)}
              </p>
            </div>
          </div>
          {user && !user.isAnonymous && (
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
