
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { StorageService } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export function BackupManager({ onDataChange }: { onDataChange: () => void }) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await StorageService.getAllEntries();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axiome_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur lors de l\'exportation' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          await StorageService.importData(data);
          onDataChange();
          toast({ title: 'Importation réussie' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Format de fichier invalide' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Exporter JSON
      </Button>
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
          accept=".json"
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Importer JSON
        </Button>
      </div>
    </div>
  );
}
