import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminRuns() {
    const [runs, setRuns] = useState([]);

    useEffect(() => {
        apiClient.admin.getRuns().then(res => setRuns(res.data)).catch(e => { if (import.meta.env.DEV) console.error(e); });
    }, []);

    return (
        <div className="container mx-auto py-8">
            <SEO title="Admin Runs" noindex={true} />
            <h1 className="text-3xl font-bold mb-6">Logs d'Import (Cron)</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Dernières Exécutions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items (New/Total)</TableHead>
                                <TableHead>Message / Logs</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {runs.map((run) => (
                                <TableRow key={run.id}>
                                    <TableCell>
                                        {format(new Date(run.createdAt), 'dd/MM HH:mm', { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={run.status === 'SUCCESS' ? 'default' : 'destructive'}>
                                            {run.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {run.items_new} / {run.items_total}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-gray-600 max-w-lg truncate">
                                        {run.logs || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
