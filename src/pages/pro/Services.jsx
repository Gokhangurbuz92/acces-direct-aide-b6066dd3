// @ts-nocheck
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Edit, Loader2, Plus, Power, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { proRdvClient } from '@/api/pro-rdv-client';

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function toNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export default function ProServices() {
  const { user } = useOutletContext();
  const canEdit = user?.role === 'STRUCTURE_ADMIN' || user?.role === 'SUPERADMIN';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: '30',
    bufferBeforeMinutes: '0',
    bufferAfterMinutes: '0',
    isActive: true,
  });

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await proRdvClient.services.list();
      setServices(Array.isArray(response) ? response : []);
    } catch {
      setError('Impossible de charger les services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      durationMinutes: '30',
      bufferBeforeMinutes: '0',
      bufferAfterMinutes: '0',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      durationMinutes: String(service.durationMinutes || 30),
      bufferBeforeMinutes: String(service.bufferBeforeMinutes || 0),
      bufferAfterMinutes: String(service.bufferAfterMinutes || 0),
      isActive: Boolean(service.isActive),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: String(formData.name || '').trim(),
      durationMinutes: toPositiveInt(formData.durationMinutes, 30),
      bufferBeforeMinutes: toNonNegativeInt(formData.bufferBeforeMinutes, 0),
      bufferAfterMinutes: toNonNegativeInt(formData.bufferAfterMinutes, 0),
      isActive: Boolean(formData.isActive),
    };

    if (!payload.name) {
      setSaving(false);
      setError('Le nom du service est requis.');
      return;
    }

    try {
      if (editingService?.id) {
        await proRdvClient.services.update(editingService.id, payload);
      } else {
        await proRdvClient.services.create(payload);
      }
      setIsDialogOpen(false);
      await fetchServices();
    } catch {
      setError("Impossible d'enregistrer le service.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service) => {
    try {
      await proRdvClient.services.update(service.id, { isActive: !service.isActive });
      await fetchServices();
    } catch {
      setError('Impossible de changer le statut du service.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try {
      await proRdvClient.services.remove(id);
      await fetchServices();
    } catch {
      setError('Suppression impossible (des rendez-vous actifs peuvent exister).');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Services</h2>
        {canEdit ? (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau service
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-slate-600">Aucun service configure.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{service.name}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      service.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {service.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p>Duree: {service.durationMinutes} min</p>
                <p>Buffers: -{service.bufferBeforeMinutes} min / +{service.bufferAfterMinutes} min</p>
                {canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                      <Edit className="mr-1 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(service)}>
                      <Power className="mr-1 h-4 w-4" />
                      {service.isActive ? 'Desactiver' : 'Activer'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Modifier le service' : 'Creer un service'}</DialogTitle>
            <DialogDescription>Configuration minimale d'un motif de rendez-vous.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Label htmlFor="service-name">Nom</Label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Duree (min)</span>
                <Input
                  type="number"
                  min={5}
                  value={formData.durationMinutes}
                  onChange={(event) => setFormData((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Buffer avant</span>
                <Input
                  type="number"
                  min={0}
                  value={formData.bufferBeforeMinutes}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, bufferBeforeMinutes: event.target.value }))
                  }
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Buffer apres</span>
                <Input
                  type="number"
                  min={0}
                  value={formData.bufferAfterMinutes}
                  onChange={(event) => setFormData((prev) => ({ ...prev, bufferAfterMinutes: event.target.value }))}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Service actif
            </label>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
