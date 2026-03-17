import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCsrfHeaders } from '@/lib/csrf';
import {
    Smartphone,
    BellRing,
    CheckCircle2,
    Loader2,
    ShieldCheck,
} from 'lucide-react';

/**
 * SmsToggle — Opt-in SMS reminder for appointments
 *
 * Props:
 * - appointmentId: string
 * - initialPhone?: string (pre-filled)
 */

const FRENCH_PHONE_RE = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.\-]*\d{2}){4}$/;

export default function SmsToggle({ appointmentId, initialPhone = '' }) {
    const [phone, setPhone] = useState(initialPhone);
    const [status, setStatus] = useState('idle'); // idle | loading | done | error
    const [errorMsg, setErrorMsg] = useState('');

    const subscribe = async () => {
        setErrorMsg('');

        if (!FRENCH_PHONE_RE.test(phone)) {
            setStatus('error');
            setErrorMsg('Numéro invalide. Format : 06 12 34 56 78');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/public/sms-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({ appointmentId, phoneNumber: phone, action: 'subscribe' }),
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || 'Erreur');
            }

            setStatus('done');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Échec de l\'activation.');
        }
    };

    if (status === 'done') {
        return (
            <Card>
                <CardContent className="p-4 text-center">
                    <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={22} />
                    <p className="text-xs font-semibold text-emerald-800">
                        Rappel SMS activé
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Vous recevrez un SMS 2h avant le RDV.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Smartphone size={14} className="text-indigo-500" />
                    <p className="text-xs font-semibold text-slate-900">Rappel par SMS</p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="tel"
                        placeholder="06 12 34 56 78"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            if (status === 'error') setStatus('idle');
                        }}
                        aria-label="Numéro de téléphone pour le rappel SMS"
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Button
                        size="sm"
                        onClick={subscribe}
                        disabled={status === 'loading' || !phone}
                    >
                        {status === 'loading' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <BellRing className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>

                {status === 'error' && errorMsg && (
                    <p className="text-[10px] text-red-500 font-medium">{errorMsg}</p>
                )}

                <p className="text-[9px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck size={8} className="shrink-0" />
                    Numéro utilisé uniquement pour ce rappel, supprimé après le RDV.
                </p>
            </CardContent>
        </Card>
    );
}
