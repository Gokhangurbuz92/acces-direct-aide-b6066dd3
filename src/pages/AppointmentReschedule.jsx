import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, CalendarClock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';

/**
 * AppointmentReschedule — Citizen rescheduling via secure token link
 *
 * Route: /appointments/reschedule/:token
 * Calls PUT /api/appointments/reschedule with { token, newDate }
 */
export default function AppointmentReschedule() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleReschedule = async () => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Lien de report invalide.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setStatus('error');
      setErrorMsg('Veuillez sélectionner une date et un créneau.');
      return;
    }

    const newStartAt = new Date(`${selectedDate}T${selectedTime}`);
    if (isNaN(newStartAt.getTime()) || newStartAt <= new Date()) {
      setStatus('error');
      setErrorMsg('La date choisie doit être dans le futur.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/appointments/reschedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newStartAt: newStartAt.toISOString(),
        }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMsg(data.error || 'Le report a échoué. Veuillez réessayer.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erreur de connexion. Veuillez réessayer.');
    }
  };

  // Compute min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Available time slots (office hours)
  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <SEO title="Rendez-vous reporté" noindex />
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg text-center p-8 border border-slate-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Rendez-vous reporté</h1>
          <p className="text-sm text-slate-500 mb-2">
            Votre nouveau créneau a été enregistré.
          </p>
          <p className="text-sm font-semibold text-slate-700 mb-8">
            {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })} à {selectedTime}
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <SEO title="Reporter mon rendez-vous" noindex />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white p-8 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CalendarClock size={24} />
          </div>
          <h1 className="text-lg font-bold">Reporter mon rendez-vous</h1>
          <p className="text-xs opacity-80 mt-1">AccesDirectAide</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Nouvelle date
            </span>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-400 focus:bg-white outline-none transition-all text-slate-700"
            />
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Créneau horaire
              </span>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${selectedTime === slot
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleReschedule}
              disabled={status === 'loading' || !selectedDate || !selectedTime}
              className="w-full"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Traitement…
                </>
              ) : (
                'Confirmer le report'
              )}
            </Button>

            <Button
              onClick={() => navigate(-1)}
              disabled={status === 'loading'}
              variant="ghost"
              className="w-full"
            >
              Conserver la date actuelle
            </Button>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">
            Un email de confirmation sera envoyé · AccesDirectAide
          </p>
        </div>
      </div>
    </div>
  );
}
