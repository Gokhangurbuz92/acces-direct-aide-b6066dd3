// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { ListSkeleton } from '@/components/pro/ProPageSkeletons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { proRdvClient } from '@/api/pro-rdv-client';

function toDateTimeLocalValue(raw) {
  if (!raw) return '';
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function toIsoFromDateTimeLocal(localValue) {
  const value = String(localValue || '').trim();
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

function formatDateTime(raw) {
  if (!raw) return '-';
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  });
}

export default function ProRdvAbsences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    startAt: '',
    endAt: '',
    reason: '',
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await proRdvClient.timeoff.list();
      setItems(Array.isArray(response?.items) ? response.items : []);
    } catch {
      setError('Impossible de charger les absences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId('');
    setForm({ startAt: '', endAt: '', reason: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      startAt: toIsoFromDateTimeLocal(form.startAt),
      endAt: toIsoFromDateTimeLocal(form.endAt),
      reason: form.reason.trim(),
    };

    try {
      if (editingId) {
        await proRdvClient.timeoff.update(editingId, payload);
      } else {
        await proRdvClient.timeoff.create(payload);
      }
      resetForm();
      await loadItems();
    } catch (requestError) {
      const status = Number(requestError?.status || 0);
      setError(status === 400 ? 'Intervalle invalide.' : 'Impossible de sauvegarder l\'absence.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      startAt: toDateTimeLocalValue(item.startAt),
      endAt: toDateTimeLocalValue(item.endAt),
      reason: item.reason || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette absence ?')) return;
    setError('');
    try {
      await proRdvClient.timeoff.remove(id);
      await loadItems();
    } catch {
      setError('Impossible de supprimer cette absence.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Modifier une absence' : 'Ajouter une absence'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Debut</span>
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Fin</span>
              <Input
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
              />
            </label>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="timeoff-reason">Raison (optionnel)</Label>
              <Input
                id="timeoff-reason"
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              />
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? 'Mettre a jour' : 'Ajouter'}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              ) : null}
            </div>
          </form>

          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Absences configurees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton count={3} />
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune absence configuree.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-slate-900">
                      {formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}
                    </p>
                    <p className="text-slate-600">{item.reason || 'Sans raison specifiee'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
