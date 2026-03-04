// @ts-nocheck
import { useEffect, useState } from 'react';
import { Clock, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { GridSkeleton } from '@/components/pro/ProPageSkeletons';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { proRdvClient } from '@/api/pro-rdv-client';

const DAYS = [
  { key: 'mon', label: 'Lundi' },
  { key: 'tue', label: 'Mardi' },
  { key: 'wed', label: 'Mercredi' },
  { key: 'thu', label: 'Jeudi' },
  { key: 'fri', label: 'Vendredi' },
  { key: 'sat', label: 'Samedi' },
  { key: 'sun', label: 'Dimanche' },
];

export default function ProAvailability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    proRdvClient.availability
      .get()
      .then((response) => {
        if (!mounted) return;
        setSlots(response?.slots_json && typeof response.slots_json === 'object' ? response.slots_json : {});
      })
      .catch(() => {
        if (!mounted) return;
        setError('Impossible de charger les disponibilites.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const addSlot = (dayKey) => {
    setSlots((prev) => {
      const next = { ...prev };
      const daySlots = Array.isArray(next[dayKey]) ? [...next[dayKey]] : [];
      daySlots.push('09:00-12:00');
      next[dayKey] = daySlots;
      return next;
    });
  };

  const updateSlot = (dayKey, index, value) => {
    setSlots((prev) => {
      const next = { ...prev };
      const daySlots = Array.isArray(next[dayKey]) ? [...next[dayKey]] : [];
      daySlots[index] = value;
      next[dayKey] = daySlots;
      return next;
    });
  };

  const removeSlot = (dayKey, index) => {
    setSlots((prev) => {
      const next = { ...prev };
      const daySlots = Array.isArray(next[dayKey]) ? [...next[dayKey]] : [];
      daySlots.splice(index, 1);
      next[dayKey] = daySlots;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await proRdvClient.availability.replace({
        slots_json: slots,
        timezone: 'Europe/Paris',
      });
      setError('');
    } catch {
      setError("Impossible d'enregistrer les disponibilites.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <GridSkeleton cols={4} rows={7} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Disponibilites</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>

      <p className="text-sm text-slate-600">
        Format attendu: <code>HH:MM-HH:MM</code>. Les absences definies dans l'onglet Absences bloquent les creneaux.
      </p>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      ) : null}

      <div className="grid gap-4">
        {DAYS.map((day) => (
          <Card key={day.key}>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-start">
              <div className="w-32 pt-1 text-sm font-semibold text-slate-700">{day.label}</div>
              <div className="flex-1 space-y-2">
                {(slots[day.key] || []).map((slot, idx) => (
                  <div key={`${day.key}-${idx}`} className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <Input
                      value={slot}
                      onChange={(event) => updateSlot(day.key, idx, event.target.value)}
                      className="max-w-[200px]"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(day.key, idx)}>
                      <Trash2 className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                ))}
                {(!slots[day.key] || slots[day.key].length === 0) && (
                  <p className="text-sm italic text-slate-500">Ferme</p>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addSlot(day.key)}>
                <Plus className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
