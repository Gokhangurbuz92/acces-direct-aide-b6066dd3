
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, Save, Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";

const DAYS = [
    { key: 'mon', label: 'Lundi' },
    { key: 'tue', label: 'Mardi' },
    { key: 'wed', label: 'Mercredi' },
    { key: 'thu', label: 'Jeudi' },
    { key: 'fri', label: 'Vendredi' },
    { key: 'sat', label: 'Samedi' },
    { key: 'sun', label: 'Dimanche' }
];

export default function ProAvailability() {
    const { user } = useOutletContext();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Structure: { mon: ["09:00-12:00"], ... }
    const [slots, setSlots] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('pro_token');
        fetch('/api/pro/availability', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setSlots(data.slots_json || {});
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('pro_token');
        try {
            const res = await fetch('/api/pro/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ slots_json: slots })
            });
            if(!res.ok) throw new Error('Failed to save');
            toast({ title: "Disponibilités enregistrées", description: "Vos créneaux ont été mis à jour." });
        } catch(e) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer." });
        } finally {
            setSaving(false);
        }
    };

    const addSlot = (dayKey) => {
        const newSlots = { ...slots };
        if(!newSlots[dayKey]) newSlots[dayKey] = [];
        newSlots[dayKey].push("09:00-12:00");
        setSlots(newSlots);
    };

    const updateSlot = (dayKey, index, value) => {
        const newSlots = { ...slots };
        newSlots[dayKey][index] = value;
        setSlots(newSlots);
    };

    const removeSlot = (dayKey, index) => {
        const newSlots = { ...slots };
        newSlots[dayKey].splice(index, 1);
        setSlots(newSlots);
    };

    if (loading) return <Loader2 className="animate-spin h-8 w-8 mx-auto" />;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Mes Disponibilités</h1>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>

            <p className="text-slate-600">
                Définissez vos horaires d'ouverture à la réservation en ligne.
                Format: <code>HH:MM-HH:MM</code>
            </p>

            <div className="grid gap-4">
                {DAYS.map(day => (
                    <Card key={day.key}>
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-start gap-4">
                            <div className="w-32 pt-2 font-semibold text-slate-700">{day.label}</div>

                            <div className="flex-1 space-y-2">
                                {(slots[day.key] || []).map((slot, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <Input
                                            value={slot}
                                            onChange={(e) => updateSlot(day.key, idx, e.target.value)}
                                            className="w-40"
                                            placeholder="09:00-12:00"
                                        />
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => removeSlot(day.key, idx)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(!slots[day.key] || slots[day.key].length === 0) && (
                                    <span className="text-sm text-slate-400 italic py-2 block">Fermé</span>
                                )}
                            </div>

                            <Button variant="outline" size="sm" onClick={() => addSlot(day.key)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Ajouter
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
