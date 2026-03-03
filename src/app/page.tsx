
'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DailyEntryForm } from '@/components/DailyEntryForm';
import { StorageService, ProductionEntry } from '@/lib/db';
import { generateDailyReport } from '@/lib/pdf-gen';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Trash2, Calendar as CalendarIcon, Database, Menu } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { BackupManager } from '@/components/BackupManager';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [entries, setEntries] = React.useState<ProductionEntry[]>([]);
  const [allEntries, setAllEntries] = React.useState<ProductionEntry[]>([]);
  const { toast } = useToast();

  const loadData = React.useCallback(async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayEntries = await StorageService.getEntriesByDate(dateStr);
    const all = await StorageService.getAllEntries();
    setEntries(dayEntries.sort((a, b) => a.time.localeCompare(b.time)));
    setAllEntries(all);
  }, [selectedDate]);

  React.useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  const handleAddEntry = async (data: Omit<ProductionEntry, 'id' | 'date'>) => {
    const newEntry: ProductionEntry = {
      ...data,
      id: crypto.randomUUID(),
      date: format(selectedDate, 'yyyy-MM-dd'),
    };
    await StorageService.saveEntry(newEntry);
    loadData();
    toast({ title: "Décharge ajoutée", description: "Enregistré avec succès" });
  };

  const handleDeleteEntry = async (id: string) => {
    await StorageService.deleteEntry(id);
    loadData();
    toast({ title: "Décharge supprimée" });
  };

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <h1 className="text-xl font-semibold italic text-slate-500">Chargement Axiome...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar 
        entries={entries} 
        allEntries={allEntries} 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 bg-primary/95 backdrop-blur-sm text-primary-foreground shadow-lg border-b border-primary/20">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="bg-white/10 hover:bg-white/20 transition-colors p-2 rounded-md">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div className="flex flex-col">
                <h1 className="text-lg font-headline font-black tracking-tight leading-none">Axiome Production</h1>
                <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Système Central à Béton</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <BackupManager onDataChange={loadData} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Header Mobile Actions */}
          <div className="flex flex-col gap-4 sm:hidden">
            <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200">
              <BackupManager onDataChange={loadData} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">État actuel</p>
              </div>
            </div>
            <Button 
              onClick={() => generateDailyReport(format(selectedDate, 'yyyy-MM-dd'), entries)}
              disabled={entries.length === 0}
              size="lg"
              className="w-full md:w-auto bg-accent hover:bg-accent/90 shadow-lg text-white font-bold"
            >
              <FileDown className="mr-2 h-5 w-5" />
              Générer Rapport PDF
            </Button>
          </div>

          <DailyEntryForm onAdd={handleAddEntry} />

          <Card className="border-none shadow-xl overflow-hidden bg-white rounded-2xl">
            <CardHeader className="bg-slate-50 border-b p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-700">Liste des décharges</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Heure</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Matière</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Quantité</TableHead>
                      <TableHead className="hidden md:table-cell font-black uppercase text-[10px] tracking-widest">Observations</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                          Aucune décharge enregistrée pour ce jour.
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-bold text-slate-900">{entry.time}</TableCell>
                          <TableCell>
                            <span className="font-black text-slate-700 uppercase tracking-tight">{entry.type}</span>
                            {entry.type === 'Gravier' && <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-black">{entry.gravelSize}</span>}
                          </TableCell>
                          <TableCell className="font-black text-primary">{entry.quantity.toFixed(2)} T</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                            {entry.observations || '-'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Totals at bottom */}
          <Card className="border-none shadow-lg bg-slate-900 text-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-lg font-black mb-6 uppercase tracking-[0.2em] text-slate-400">Récapitulatif Détaillé</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Ciment</p>
                  <p className="text-3xl font-black">{totals.ciment.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Gravier 3/8</p>
                  <p className="text-3xl font-black">{totals.g38.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Gravier 8/16</p>
                  <p className="text-3xl font-black">{totals.g816.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Gravier 0/3</p>
                  <p className="text-3xl font-black">{totals.g03.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Adjuvant</p>
                  <p className="text-3xl font-black">{totals.adjuvant.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
      <Toaster />
    </>
  );
}
