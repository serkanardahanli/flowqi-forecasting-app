'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DatePicker } from '@/app/components/ui/date-picker';
import { useToast } from '@/app/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ExactSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  const fetchSyncLogs = async () => {
    const { data, error } = await supabase
      .from('exact_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sync logs',
        variant: 'destructive',
      });
      return;
    }

    setSyncLogs(data || []);
  };

  const syncGLAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/exact/sync-gl-accounts', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync GL accounts');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: `Synced ${result.recordsProcessed} GL accounts (${result.recordsCreated} created, ${result.recordsUpdated} updated)`,
      });
      fetchSyncLogs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync GL accounts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncTransactions = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/exact/sync-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync transactions');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: `Synced ${result.recordsProcessed} transactions (${result.recordsCreated} created, ${result.recordsUpdated} updated)`,
      });
      fetchSyncLogs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync transactions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Exact Online Integration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grootboekrekeningen</CardTitle>
            <CardDescription>Synchroniseer grootboekrekeningen uit Exact Online</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Dit synchroniseert alle grootboekrekeningen uit Exact Online en categoriseert ze op basis van hun code.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={syncGLAccounts} disabled={isLoading}>
              {isLoading ? 'Synchroniseren...' : 'Synchroniseer Grootboekrekeningen'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transacties</CardTitle>
            <CardDescription>Synchroniseer transacties uit Exact Online</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Startdatum</label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Einddatum</label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={syncTransactions} disabled={isLoading}>
              {isLoading ? 'Synchroniseren...' : 'Synchroniseer Transacties'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Synchronisatie Logs</CardTitle>
          <CardDescription>Bekijk de recente synchronisatie activiteiten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Datum</th>
                  <th className="text-left py-2">Verwerkt</th>
                  <th className="text-left py-2">Aangemaakt</th>
                  <th className="text-left py-2">Bijgewerkt</th>
                  <th className="text-left py-2">Mislukt</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2">{log.sync_type === 'gl_accounts' ? 'Grootboekrekeningen' : 'Transacties'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'completed' ? 'bg-green-100 text-green-800' :
                        log.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status === 'completed' ? 'Voltooid' :
                         log.status === 'failed' ? 'Mislukt' :
                         'Verwerken'}
                      </span>
                    </td>
                    <td className="py-2">{format(new Date(log.created_at), 'dd-MM-yyyy HH:mm')}</td>
                    <td className="py-2">{log.records_processed || 0}</td>
                    <td className="py-2">{log.records_created || 0}</td>
                    <td className="py-2">{log.records_updated || 0}</td>
                    <td className="py-2">{log.records_failed || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 