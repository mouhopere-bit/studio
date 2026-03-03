
'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarView } from '@/components/CalendarView';
import { DailyEntryForm } from '@/components/DailyEntryForm';
import { StorageService, ProductionEntry } from '@/lib/db';
import { generateDailyReport } from '@/lib/pdf-gen';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Trash2, LayoutDashboard, Calendar as CalendarIcon, Database } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { BackupManager } from '@/components/BackupManager';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-primary text-primary-foreground shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-bold tracking-tight">Axiome Central à Béton</h1>
              <p className="text-sm opacity-80">Gestion de la Production Journalière</p>
            </div>
          </div>
          <BackupManager onDataChange={loadData} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Calendar & Tools */}
        <div className="lg:col-span-4 space-y-6">
          <CalendarView 
            entries={allEntries} 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
          />
          
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                Résumé du Jour
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Général</span>
                <span className="text-3xl font-bold text-primary">{totals.grandTotal.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">Tonnes</span></span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-bold uppercase">Ciment</p>
                  <p className="text-xl font-bold">{totals.ciment.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700 font-bold uppercase">Adjuvant</p>
                  <p className="text-xl font-bold">{totals.adjuvant.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Entry & List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</h2>
            </div>
            <Button 
              onClick={() => generateDailyReport(format(selectedDate, 'yyyy-MM-dd'), entries)}
              disabled={entries.length === 0}
              className="bg-accent hover:bg-accent/90"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>

          <DailyEntryForm onAdd={handleAddEntry} />

          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Liste des décharges</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Heure</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead className="hidden md:table-cell">Observations</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucune décharge enregistrée pour ce jour.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.time}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{entry.type}</span>
                          {entry.type === 'Gravier' && <span className="text-xs ml-1 px-1.5 py-0.5 bg-slate-100 rounded">{entry.gravelSize}</span>}
                        </TableCell>
                        <TableCell>{entry.quantity.toFixed(2)} T</TableCell>
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
            </CardContent>
          </Card>

          {/* Detailed Totals for the bottom */}
          <Card className="border-none shadow-sm bg-slate-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 uppercase text-slate-600 tracking-tight">Détail des Totaux du Jour</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-600">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Ciment</p>
                  <p className="text-2xl font-bold">{totals.ciment.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-amber-600">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Gravier 3/8</p>
                  <p className="text-2xl font-bold">{totals.g38.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-amber-500">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Gravier 8/16</p>
                  <p className="text-2xl font-bold">{totals.g816.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-amber-400">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Gravier 0/3</p>
                  <p className="text-2xl font-bold">{totals.g03.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-indigo-600">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Adjuvant</p>
                  <p className="text-2xl font-bold">{totals.adjuvant.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
