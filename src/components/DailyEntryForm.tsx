'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProductionEntry } from '@/lib/db';
import { PlusCircle } from 'lucide-react';

const formSchema = z.object({
  type: z.enum(['Ciment', 'Gravier', 'Adjuvant']),
  gravelSize: z.enum(['3/8', '8/16', '0/3']).optional(),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "La quantité doit être un nombre positif",
  }),
  time: z.string().min(1, "L'heure est requise"),
  observations: z.string().optional(),
}).refine((data) => {
  if (data.type === 'Gravier' && !data.gravelSize) return false;
  return true;
}, {
  message: "La taille du gravier est obligatoire",
  path: ["gravelSize"],
});

interface DailyEntryFormProps {
  onAdd: (entry: Omit<ProductionEntry, 'id' | 'date'>) => void;
}

export function DailyEntryForm({ onAdd }: DailyEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'Ciment',
      quantity: '',
      time: '',
      observations: '',
    },
  });

  const watchType = form.watch('type');

  React.useEffect(() => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    form.setValue('time', currentTime);
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAdd({
      type: values.type,
      gravelSize: values.gravelSize,
      quantity: parseFloat(values.quantity),
      time: values.time,
      observations: values.observations,
    });
    form.reset({
      ...form.getValues(),
      quantity: '',
      observations: '',
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 md:p-6 rounded-2xl border shadow-xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Saisie d'une décharge</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold uppercase text-[10px]">Matière</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="font-bold">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Ciment">Ciment</SelectItem>
                    <SelectItem value="Gravier">Gravier</SelectItem>
                    <SelectItem value="Adjuvant">Adjuvant</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchType === 'Gravier' && (
            <FormField
              control={form.control}
              name="gravelSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-[10px]">Taille</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-bold">
                        <SelectValue placeholder="Taille" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="3/8">3/8</SelectItem>
                      <SelectItem value="8/16">8/16</SelectItem>
                      <SelectItem value="0/3">0/3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold uppercase text-[10px]">
                  {watchType === 'Adjuvant' ? 'Qté (Litres)' : 'Qté (Tonnes)'}
                </FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" className="font-bold" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold uppercase text-[10px]">Heure</FormLabel>
                <FormControl>
                  <Input type="time" className="font-bold" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold uppercase text-[10px]">Observations</FormLabel>
              <FormControl>
                <Textarea placeholder="Notes..." className="font-medium resize-none h-20" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full md:w-auto font-black uppercase tracking-widest text-xs shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter la décharge
        </Button>
      </form>
    </Form>
  );
}
