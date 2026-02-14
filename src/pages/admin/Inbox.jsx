import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/client';
import SEO from '@/components/SEO';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminInbox() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('brouillon');
    const [page] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const fetchInbox = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.admin.getInbox(statusFilter, page);
            setItems(res.data);
        } catch {
            toast.error("Erreur chargement Inbox");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page]);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    const handleAction = async (action, id) => {
        const ids = id ? [id] : selectedIds;
        if (ids.length === 0) return;

        try {
            await apiClient.admin.performAction(action, ids);
            toast.success(`Action ${action} effectuée`);
            fetchInbox();
            setSelectedIds([]);
        } catch {
            toast.error("Erreur action");
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getScoreColor = (score) => {
        if (score >= 80) return "bg-green-100 text-green-800";
        if (score >= 50) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <SEO title="Admin Inbox" noindex={true} />

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Boîte de Réception</h1>
                <div className="space-x-2">
                    <Button variant={statusFilter === 'brouillon' ? 'default' : 'outline'} onClick={() => setStatusFilter('brouillon')}>Brouillons</Button>
                    <Button variant={statusFilter === 'actif' ? 'default' : 'outline'} onClick={() => setStatusFilter('actif')}>Publiés</Button>
                    <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejetés</Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Items ({items.length})</CardTitle>
                    <div className="space-x-2">
                        <Button size="sm" variant="secondary" onClick={fetchInbox}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
                        {selectedIds.length > 0 && (
                            <>
                                <Button size="sm" onClick={() => handleAction('PUBLISH')}>Tout Publier</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleAction('REJECT')}>Tout Rejeter</Button>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Select</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Titre / FALC</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                                </TableRow>
                            ) : items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(item.fetched_at), 'dd/MM HH:mm', { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.source_name}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <div className="font-medium truncate" title={item.titre}>{item.titre}</div>
                                        <div className="text-sm text-gray-500 flex items-center mt-1">
                                            {item.falc_status === 'generated' ? (
                                                <Badge variant="secondary" className="text-xs mr-2">FALC OK</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-xs mr-2">FALC {item.falc_status}</Badge>
                                            )}
                                            <a href={item.canonical_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                                                Original <ExternalLink className="h-3 w-3 ml-1" />
                                            </a>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getScoreColor(item.quality_score)}>
                                            {item.quality_score}/100
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleAction('PUBLISH', item.id)} title="Publier">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleAction('REJECT', item.id)} title="Rejeter">
                                                <X className="h-4 w-4" />
                                            </Button>
                                            {item.falc_status === 'failed' && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleAction('RETRY_FALC', item.id)} title="Relancer FALC">
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
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
