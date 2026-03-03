'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { DailyEntryForm } from '@/components/DailyEntryForm';
import { generateDailyReport } from '@/lib/pdf-gen';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Trash2, Calendar as CalendarIcon, Database, Menu, Send, CheckCircle2, Lock, Share2, UserCheck } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isMounted, setIsMounted] = React.useState(false);

  // Determine the target employee ID from URL or current user
  const empIdParam = searchParams.get('empId');
  const targetUid = empIdParam || user?.uid;
  const isReadOnly = user?.uid !== targetUid;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const dateStr = isMounted ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Auto-login anonymously if not logged in
  React.useEffect(() => {
    if (isMounted && !isUserLoading && !user && db) {
      import('firebase/auth').then(({ getAuth, signInAnonymously }) => {
        signInAnonymously(getAuth());
      });
    }
  }, [user, isUserLoading, db, isMounted]);

  // Firestore References using targetUid
  const productionDayRef = useMemoFirebase(() => {
    if (!db || !targetUid || !dateStr) return null;
    return doc(db, 'employees', targetUid, 'productionDays', dateStr);
  }, [db, targetUid, dateStr]);

  const dischargesQuery = useMemoFirebase(() => {
    if (!db || !targetUid || !dateStr) return null;
    return collection(db, 'employees', targetUid, 'productionDays', dateStr, 'discharges');
  }, [db, targetUid, dateStr]);

  const { data: dayInfo, isLoading: isDayLoading } = useDoc(productionDayRef);
  const { data: entries, isLoading: isEntriesLoading } = useCollection(dischargesQuery);

  const handleAddEntry = (data: any) => {
    if (!db || !user || !dischargesQuery || !productionDayRef || !dateStr || isReadOnly) return;

    if (dayInfo?.isSubmitted) {
      toast({ variant: 'destructive', title: "Action impossible", description: "Ce rapport a déjà été soumis." });
      return;
    }

    setDocumentNonBlocking(productionDayRef, {
      id: dateStr,
      employeeId: user.uid,
      date: dateStr,
      lastUpdated: serverTimestamp(),
      isSubmitted: dayInfo?.isSubmitted ?? false,
    }, { merge: true });

    const colRef = collection(db, 'employees', user.uid, 'productionDays', dateStr, 'discharges');
    
    const payload = {
      ...data,
      productionDayId: dateStr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      productionDayIsSubmitted: dayInfo?.isSubmitted ?? false,
      employeeId: user.uid
    };

    Object.keys(payload).forEach(key => {
      if ((payload as any)[key] === undefined) {
        delete (payload as any)[key];
      }
    });

    addDocumentNonBlocking(colRef, payload);
    toast({ title: "Décharge ajoutée" });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!db || !user || !dateStr || dayInfo?.isSubmitted || isReadOnly) return;
    const entryRef = doc(db, 'employees', user.uid, 'productionDays', dateStr, 'discharges', entryId);
    deleteDocumentNonBlocking(entryRef);
    toast({ title: "Décharge supprimée" });
  };

  const handleToggleSubmit = () => {
    if (!productionDayRef || !user || !dateStr || isReadOnly) return;
    const newStatus = !dayInfo?.isSubmitted;
    
    setDocumentNonBlocking(productionDayRef, {
      employeeId: user.uid,
      isSubmitted: newStatus,
      submissionTimestamp: newStatus ? serverTimestamp() : null,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    toast({ 
      title: newStatus ? "Rapport soumis !" : "Rapport réouvert", 
      description: newStatus ? "Votre supérieur peut maintenant le consulter." : "Vous pouvez à nouveau modifier les données."
    });
  };

  const handleShareLink = () => {
    if (!user) return;
    const url = new URL(window.location.href);
    url.searchParams.set('empId', user.uid);
    navigator.clipboard.writeText(url.toString());
    toast({ title: "Lien copié !", description: "Partagez ce lien avec votre supérieur." });
  };

  const totals = React.useMemo(() => {
    if (!entries) return { ciment: 0, adjuvant: 0, g38: 0, g816: 0, g03: 0, grandTotal: 0 };
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

  if (!isMounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <h1 className="text-xl font-semibold italic text-slate-500">Connexion Axiome Cloud...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar 
        entries={entries || []} 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate}
        targetUid={targetUid || ''}
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
                <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Système Cloud Central</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isReadOnly && (
                <Badge className="bg-amber-500 text-white gap-1 px-3 py-1">
                  <UserCheck className="w-3 h-3" /> Vue Supérieur
                </Badge>
              )}
              {dayInfo?.isSubmitted ? (
                <Badge className="bg-green-500 text-white gap-1 px-3 py-1">
                  <CheckCircle2 className="w-3 h-3" /> Soumis
                </Badge>
              ) : (
                <Badge variant="outline" className="text-white border-white/30">Brouillon</Badge>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">État du Rapport</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isReadOnly && (
                <>
                  <Button 
                    onClick={handleToggleSubmit}
                    variant={dayInfo?.isSubmitted ? "outline" : "default"}
                    className={!dayInfo?.isSubmitted ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                  >
                    {dayInfo?.isSubmitted ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                    {dayInfo?.isSubmitted ? "Réouvrir" : "Soumettre au supérieur"}
                  </Button>
                  <Button onClick={handleShareLink} variant="outline" size="icon" title="Partager le lien">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button 
                onClick={() => generateDailyReport(dateStr, entries || [])}
                disabled={!entries || entries.length === 0}
                variant="secondary"
                className="bg-accent hover:bg-accent/90 text-white font-bold"
              >
                <FileDown className="mr-2 h-5 w-5" />
                Rapport PDF
              </Button>
            </div>
          </div>

          {!isReadOnly && !dayInfo?.isSubmitted ? (
            <DailyEntryForm onAdd={handleAddEntry} />
          ) : (
            <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
              <CardContent className="flex items-center justify-center p-8 gap-4 text-slate-500">
                <Lock className="w-8 h-8 opacity-50" />
                <div className="text-center md:text-left">
                  <p className="font-bold">{isReadOnly ? "Lecture Seule" : "Rapport Verrouillé"}</p>
                  <p className="text-sm">
                    {isReadOnly 
                      ? "Vous consultez le rapport d'un autre utilisateur." 
                      : "Ce rapport a été soumis. Réouvrez-le pour ajouter de nouvelles décharges."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-xl overflow-hidden bg-white rounded-2xl">
            <CardHeader className="bg-slate-50 border-b p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-700">Décharges du jour</CardTitle>
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
                      {!dayInfo?.isSubmitted && !isReadOnly && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isDayLoading || isEntriesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground animate-pulse">
                          Synchronisation des données...
                        </TableCell>
                      </TableRow>
                    ) : !entries || entries.length === 0 ? (
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
                          {!dayInfo?.isSubmitted && !isReadOnly && (
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
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

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