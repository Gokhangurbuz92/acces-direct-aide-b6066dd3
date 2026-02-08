import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Flag, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const REASON_OPTIONS = [
  { value: 'LIEN_MORT', label: 'Lien mort ou cassé' },
  { value: 'HORAIRES_FAUX', label: 'Horaires incorrects' },
  { value: 'INFO_FAUSSE', label: 'Information fausse' },
  { value: 'INFO_OBSOLETE', label: 'Information obsolète' },
  { value: 'AUTRE', label: 'Autre problème' },
];

export default function ReportErrorModal({ contentType, contentId, trigger }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reason,
          message: message || undefined,
          pageUrl: window.location.href,
          reporterEmail: email || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setStatus('success');
      setTimeout(() => {
        setOpen(false);
        // Reset after close animation
        setTimeout(() => {
          setStatus('idle');
          setReason('');
          setMessage('');
          setEmail('');
        }, 300);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Une erreur est survenue');
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" className="w-full text-slate-600">
      <Flag className="mr-2 h-4 w-4" />
      Signaler une erreur
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Signaler une erreur</DialogTitle>
          <DialogDescription>
            Aidez-nous à maintenir des informations fiables. Votre signalement sera traité rapidement.
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-center font-medium text-slate-900">
              Merci pour votre signalement !
            </p>
            <p className="text-center text-sm text-slate-600">
              Notre équipe va vérifier et corriger cette fiche.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Type de problème *</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Sélectionnez un motif" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Détails (optionnel)</Label>
              <Textarea
                id="message"
                placeholder="Décrivez le problème constaté..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Votre email (optionnel)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Pour être informé de la correction"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Uniquement pour vous informer de la correction. Jamais partagé.
              </p>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={status === 'loading'}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!reason || status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer le signalement'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
