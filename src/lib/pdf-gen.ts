
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProductionEntry } from './db';

export const generateDailyReport = (date: string, entries: ProductionEntry[]) => {
  const doc = jsPDF();
  const formattedDate = format(new Date(date), 'dd MMMM yyyy', { locale: fr });

  // Header
  doc.setFontSize(22);
  doc.setTextColor(31, 89, 160); // #1F59A0
  doc.text('Axiome Central à Béton', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(100);
  doc.text(`Rapport Journalier de Production`, 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Date: ${formattedDate}`, 20, 45);

  // Table of entries
  const tableData = entries.map(entry => [
    entry.time,
    entry.type === 'Gravier' ? `Gravier ${entry.gravelSize}` : entry.type,
    entry.quantity.toFixed(2),
    entry.observations || '-'
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Heure', 'Matière', 'Quantité', 'Observations']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillStyle: 'F', fillColor: [31, 89, 160], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Totals Summary
  const totals = calculateTotals(entries);
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(14);
  doc.setTextColor(31, 89, 160);
  doc.text('Récapitulatif des Totaux', 20, finalY);

  const summaryData = [
    ['Ciment Total', `${totals.ciment.toFixed(2)}`],
    ['Adjuvant Total', `${totals.adjuvant.toFixed(2)}`],
    ['Gravier 3/8 Total', `${totals.g38.toFixed(2)}`],
    ['Gravier 8/16 Total', `${totals.g816.toFixed(2)}`],
    ['Gravier 0/3 Total', `${totals.g03.toFixed(2)}`],
    ['TOTAL GÉNÉRAL', `${totals.grandTotal.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: finalY + 5,
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 11, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } }
  });

  // Signature area
  const signatureY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Signature de l\'employé :', 20, signatureY);
  doc.line(20, signatureY + 15, 80, signatureY + 15);

  doc.save(`Rapport_Axiome_${date}.pdf`);
};

const calculateTotals = (entries: ProductionEntry[]) => {
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
};
