
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Loader2, Save } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

export default function ProServices() {
    const { user } = useOutletContext();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description_falc: '',
        duration_minutes: '',
        modes: [],
        audiences: []
    });

    const canEdit = user?.role === 'STRUCTURE_ADMIN' || user?.role === 'SUPERADMIN';

    const fetchServices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('pro_token');
            const res = await fetch('/api/pro/services', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setServices(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('pro_token');
        const method = editingService ? 'PUT' : 'POST';
        const url = editingService ? `/api/pro/services?id=${editingService.id}` : '/api/pro/services';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchServices();
                setIsDialogOpen(false);
                setEditingService(null);
                setFormData({ name: '', description_falc: '', duration_minutes: '', modes: [], audiences: [] });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const openEdit = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            description_falc: service.description_falc || '',
            duration_minutes: service.duration_minutes || '',
            modes: service.modes || [],
            audiences: service.audiences || []
        });
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setEditingService(null);
        setFormData({ name: '', description_falc: '', duration_minutes: '', modes: [], audiences: [] });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer ce service ?")) return;
        const token = localStorage.getItem('pro_token');
        await fetch(`/api/pro/services?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchServices();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Mes Services</h1>
                {canEdit && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Service
                    </Button>
                )}
            </div>

            {loading ? (
                <Loader2 className="animate-spin" />
            ) : services.length === 0 ? (
                <p className="text-slate-500">Aucun service configuré.</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <Card key={service.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span>{service.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{service.description_falc}</p>
                                <div className="flex gap-2">
                                    {canEdit && (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog Form */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Modifier le service' : 'Créer un service'}</DialogTitle>
                        <DialogDescription>Définissez les détails du service pour le public.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Nom</Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                            <Label>Description (FALC)</Label>
                            <Textarea value={formData.description_falc} onChange={e => setFormData({ ...formData, description_falc: e.target.value })} />
                            <p className="text-xs text-slate-500">Facile à lire et à comprendre.</p>
                        </div>
                        <div>
                            <Label>Durée (minutes)</Label>
                            <Input type="number" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
