import { useState } from 'react';
import { client } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Send, 
  CheckCircle2, 
  Mail,
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';

const SUJETS = [
  { value: 'question', label: 'J\'ai une question' },
  { value: 'signalement_erreur', label: 'Je signale une erreur ou une info obsolète' },
  { value: 'suggestion', label: 'J\'ai une suggestion' },
  { value: 'partenariat', label: 'Proposition de partenariat' },
  { value: 'autre', label: 'Autre' },
];

export default function Contact() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const [form, setForm] = useState({
    nom: '',
    email: '',
    sujet: urlParams.get('sujet') || '',
    message: '',
    page_concernee: urlParams.get('page') || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.sujet || !form.message) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);

    try {
      await client.entities.Contact.create({
        nom: form.nom,
        email: form.email,
        sujet: form.sujet,
        message: form.message,
        page_concernee: form.page_concernee,
        statut: 'nouveau'
      });
      setIsSubmitted(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Message envoyé !
            </h1>
            <p className="text-slate-600 mb-6">
              Merci pour votre message. Nous vous répondrons dès que possible.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Nous contacter
          </h1>
          <p className="text-slate-600">
            Une question, une suggestion ou une erreur à signaler ? Écrivez-nous.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="nom">Votre nom (facultatif)</Label>
                <Input
                  id="nom"
                  type="text"
                  placeholder="Jean Dupont"
                  value={form.nom}
                  onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Votre email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.fr"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              {/* Sujet */}
              <div className="space-y-2">
                <Label htmlFor="sujet">
                  Sujet <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.sujet}
                  onValueChange={(value) => setForm(prev => ({ ...prev, sujet: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUJETS.map((sujet) => (
                      <SelectItem key={sujet.value} value={sujet.value}>
                        {sujet.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page concernée (si signalement) */}
              {form.sujet === 'signalement_erreur' && (
                <div className="space-y-2">
                  <Label htmlFor="page">Page concernée (facultatif)</Label>
                  <Input
                    id="page"
                    type="text"
                    placeholder="URL ou nom de la page"
                    value={form.page_concernee}
                    onChange={(e) => setForm(prev => ({ ...prev, page_concernee: e.target.value }))}
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Votre message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez votre question ou remarque..."
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Soumettre */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer mon message
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Vos données sont utilisées uniquement pour répondre à votre message. 
                Consultez notre <a href="/confidentialite" className="text-blue-600 hover:underline">politique de confidentialité</a> pour plus d'informations.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Autres moyens de contact */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Par email</h3>
              <p className="text-slate-600 text-sm">
                contact@accesdirectaide.fr
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Assistant</h3>
              <p className="text-slate-600 text-sm">
                Utilisez notre assistant en bas à droite
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
