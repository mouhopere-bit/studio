'use client';

import React, { Suspense } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { DailyEntryForm } from '@/components/DailyEntryForm';
import { generateDailyReport } from '@/lib/pdf-gen';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Trash2, Calendar as CalendarIcon, Send, CheckCircle2, Lock, Share2, Eye } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Badge } from '@/components/ui/badge';

const AxiomeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
    <path d="M21 21V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14" />
    <path d="M3 10h18" />
    <path d="M10 5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
  </svg>
);

function HomeContent() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isMounted, setIsMounted] = React.useState(false);

  // Déterminer l'ID de l'employé cible (via URL ou utilisateur actuel)
  const empIdParam = searchParams.get('empId');
  const targetUid = empIdParam || user?.uid;
  const isReadOnly = user?.uid !== targetUid;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const dateStr = isMounted ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Auto-connexion anonyme si nécessaire
  React.useEffect(() => {
    if (isMounted && !isUserLoading && !user && db) {
      import('firebase/auth').then(({ getAuth, signInAnonymously }) => {
        signInAnonymously(getAuth());
      });
    }
  }, [user, isUserLoading, db, isMounted]);

  // Références Firestore
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
    if (!db || !user || !productionDayRef || !dateStr || isReadOnly) return;

    if (dayInfo?.isSubmitted) {
      toast({ variant: 'destructive', title: 'Action impossible', description: 'Le rapport est déjà soumis.' });
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
      employeeId: user.uid,
      productionDayIsSubmitted: dayInfo?.isSubmitted ?? false
    };

    Object.keys(payload).forEach(key => {
      if ((payload as any)[key] === undefined) delete (payload as any)[key];
    });

    addDocumentNonBlocking(colRef, payload);
    toast({ title: 'Décharge enregistrée' });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!db || !user || isReadOnly || dayInfo?.isSubmitted) return;
    const entryRef = doc(db, 'employees', user.uid, 'productionDays', dateStr, 'discharges', entryId);
    deleteDocumentNonBlocking(entryRef);
    toast({ title: 'Décharge supprimée' });
  };

  const handleToggleSubmit = () => {
    if (!productionDayRef || !user || isReadOnly) return;
    const newStatus = !dayInfo?.isSubmitted;
    
    setDocumentNonBlocking(productionDayRef, {
      employeeId: user.uid,
      isSubmitted: newStatus,
      submissionTimestamp: newStatus ? serverTimestamp() : null,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    toast({ 
      title: newStatus ? 'Rapport soumis' : 'Rapport réouvert',
      description: newStatus ? 'Disponible pour consultation par le supérieur.' : 'Modifications autorisées.'
    });
  };

  const handleShareLink = () => {
    if (!user) return;
    const url = new URL(window.location.origin);
    url.searchParams.set('empId', user.uid);
    navigator.clipboard.writeText(url.toString());
    toast({ title: 'Lien de partage copié !', description: 'Envoyez ce lien à votre supérieur pour qu\'il puisse voir ce rapport.' });
  };

  const totals = React.useMemo(() => {
    if (!entries) return { ciment: 0, adjuvant: 0, g38: 0, g816: 0, g03: 0, totalPoids: 0, totalAdjuvant: 0 };
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

  if (!isMounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AxiomeLogo className="w-16 h-16 text-primary animate-pulse" />
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
        <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md h-16 flex items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="bg-white/10 hover:bg-white/20">
              <AxiomeLogo className="w-6 h-6" />
            </SidebarTrigger>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight">Axiome Production</h1>
              <span className="text-[10px] uppercase tracking-widest opacity-70">Axiome Centrale à Béton</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isReadOnly ? (
              <Badge variant="secondary" className="bg-blue-500 text-white gap-1">
                <Eye className="w-3 h-3" /> Consultation
              </Badge>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleShareLink} className="text-white hover:bg-white/10 gap-2">
                <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Partager</span>
              </Button>
            )}
            {dayInfo?.isSubmitted && (
              <Badge className="bg-green-600 text-white gap-1">
                <CheckCircle2 className="w-3 h-3" /> Soumis
              </Badge>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 capitalize">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Données synchronisées Cloud</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isReadOnly && (
                <Button 
                  onClick={handleToggleSubmit}
                  variant={dayInfo?.isSubmitted ? 'outline' : 'default'}
                  className={!dayInfo?.isSubmitted ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  {dayInfo?.isSubmitted ? <Lock className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                  {dayInfo?.isSubmitted ? 'Réouvrir le rapport' : 'Soumettre au supérieur'}
                </Button>
              )}
              <Button 
                onClick={() => generateDailyReport(dateStr, entries || [])}
                disabled={!entries || entries.length === 0}
                variant="secondary"
                className="bg-slate-800 text-white hover:bg-slate-900"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>
            </div>
          </div>

          {!isReadOnly && !dayInfo?.isSubmitted ? (
            <DailyEntryForm onAdd={handleAddEntry} />
          ) : (
            <Card className="bg-slate-50/50 border-dashed">
              <CardContent className="flex items-center justify-center p-10 gap-4 text-slate-400">
                <Lock className="w-6 h-6" />
                <p className="font-medium text-sm">
                  {isReadOnly ? 'Vous consultez le rapport en lecture seule.' : 'Rapport soumis et verrouillé.'}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/80 border-b px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Registre des décharges</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Heure</TableHead>
                    <TableHead className="font-bold">Désignation</TableHead>
                    <TableHead className="font-bold">Quantité</TableHead>
                    <TableHead className="hidden md:table-cell font-bold">Notes</TableHead>
                    {!dayInfo?.isSubmitted && !isReadOnly && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isDayLoading || isEntriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground animate-pulse italic">Récupération des données cloud...</TableCell>
                    </TableRow>
                  ) : !entries || entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">Aucune donnée pour cette date.</TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-700">{entry.time}</TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-900">{entry.type}</span>
                          {entry.type === 'Gravier' && <Badge variant="outline" className="ml-2 font-bold">{entry.gravelSize}</Badge>}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          {entry.quantity.toFixed(2)} {entry.type === 'Adjuvant' ? 'L' : 'T'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{entry.observations || '-'}</TableCell>
                        {!dayInfo?.isSubmitted && !isReadOnly && (
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEntry(entry.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-slate-900 text-white border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Poids Total</p>
                <p className="text-2xl font-black">{totals.totalPoids.toFixed(1)} <span className="text-xs">T</span></p>
              </CardContent>
            </Card>
            <Card className="bg-blue-600 text-white border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">Ciment</p>
                <p className="text-2xl font-black">{totals.ciment.toFixed(1)} <span className="text-xs">T</span></p>
              </CardContent>
            </Card>
            <Card className="bg-amber-600 text-white border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200 mb-1">G 3/8</p>
                <p className="text-2xl font-black">{totals.g38.toFixed(1)} <span className="text-xs">T</span></p>
              </CardContent>
            </Card>
            <Card className="bg-amber-600 text-white border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200 mb-1">G 8/16</p>
                <p className="text-2xl font-black">{totals.g816.toFixed(1)} <span className="text-xs">T</span></p>
              </CardContent>
            </Card>
            <Card className="bg-amber-600 text-white border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200 mb-1">G 0/3</p>
                <p className="text-2xl font-black">{totals.g03.toFixed(1)} <span className="text-xs">T</span></p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-600 text-white border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">Adjuvant</p>
                <p className="text-2xl font-black">{totals.adjuvant.toFixed(1)} <span className="text-xs">L</span></p>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
      <Toaster />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AxiomeLogo className="w-16 h-16 text-primary animate-pulse" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
