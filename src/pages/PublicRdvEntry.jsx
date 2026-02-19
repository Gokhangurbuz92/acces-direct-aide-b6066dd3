// @ts-nocheck
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { client } from '@/api/client';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';

/**
 * @returns {string | null}
 */
function getSessionToken() {
  if (typeof window === 'undefined') return null;

  const adminToken = sessionStorage.getItem('access_token');
  if (adminToken) return adminToken;

  const proToken = localStorage.getItem('pro_token');
  if (proToken) return proToken;

  return null;
}

/**
 * @param {any} queryData
 */
function resolveStructure(queryData) {
  if (Array.isArray(queryData)) return queryData[0] || null;
  if (queryData?.items && Array.isArray(queryData.items)) return queryData.items[0] || null;
  return queryData || null;
}

/**
 * @param {string} raw
 */
function toDateInput(raw) {
  const date = new Date(String(raw || ''));
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

/**
 * @param {number} days
 */
function futureDateInput(days) {
  const value = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return value.toISOString().slice(0, 10);
}

/**
 * @param {string} raw
 */
function formatDateTime(raw) {
  const date = new Date(String(raw || ''));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  });
}

/**
 * @param {any} error
 * @param {string} fallback
 */
function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error?.payload?.error && typeof error.payload.error === 'string') return error.payload.error;
  if (error?.message && typeof error.message === 'string') return error.message;
  return fallback;
}

/**
 * @param {string} path
 * @param {{ method?: string, token?: string | null, body?: any }=} options
 */
async function apiRequest(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();

  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  }).catch(() => null);

  if (!response) {
    const error = new Error('Network error');
    error.status = 0;
    throw error;
  }

  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

/**
 * @param {{ view?: 'landing' | 'services' | 'creneaux' }} props
 */
export default function PublicRdvEntry({ view = 'landing' }) {
  const { structureSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const structureId = String(searchParams.get('structureId') || '').trim();
  const selectedServiceId = String(searchParams.get('serviceId') || '').trim();
  const appointmentId = String(searchParams.get('appointment') || '').trim();
  const token = getSessionToken();

  const [fromDate, setFromDate] = useState(toDateInput(searchParams.get('from')));
  const [toDate, setToDate] = useState(toDateInput(searchParams.get('to') || futureDateInput(14)));
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingInfo, setBookingInfo] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const {
    data: structureData,
    isLoading: structureLoading,
  } = useQuery({
    queryKey: ['public-rdv-structure', structureId || structureSlug],
    queryFn: () => client.entities.Structure.filter(structureId ? { id: structureId } : { slug: structureSlug }),
    enabled: Boolean(structureId || structureSlug),
  });

  const {
    data: authState,
    isLoading: authLoading,
  } = useQuery({
    queryKey: ['public-rdv-auth', token ? 'bearer' : 'cookie'],
    enabled: true,
    staleTime: 30 * 1000,
    queryFn: async () => {
      try {
        const payload = await apiRequest('/api/auth/me', {
          method: 'GET',
          token,
        });

        return {
          authenticated: true,
          sessionKind: payload?.session?.kind || null,
          user: payload?.user || null,
        };
      } catch {
        return { authenticated: false, sessionKind: null, user: null };
      }
    },
  });

  const structure = resolveStructure(structureData);
  const safeNext = normalizeNextPath(location.pathname + location.search, '/annuaire');
  const isRdvPublished = Boolean(structure?.rdv?.isPublished ?? structure?.is_pro_enabled);

  const baseSlug = String(structure?.slug || structureSlug || '').trim();
  const basePath = baseSlug ? `/rdv/${encodeURIComponent(baseSlug)}` : '/annuaire';

  const isUserSession = authState?.sessionKind === 'user';

  const querySuffix = useMemo(() => {
    const params = new URLSearchParams();
    if (structureId) params.set('structureId', structureId);
    if (selectedServiceId) params.set('serviceId', selectedServiceId);
    if (appointmentId) params.set('appointment', appointmentId);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    const text = params.toString();
    return text ? `?${text}` : '';
  }, [appointmentId, fromDate, selectedServiceId, structureId, toDate]);

  const {
    data: servicesPayload,
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ['public-rdv-services', baseSlug, isUserSession],
    enabled: Boolean(baseSlug && isRdvPublished && isUserSession),
    queryFn: () => apiRequest(`/api/rdv/structures/${encodeURIComponent(baseSlug)}/services`, { token }),
  });

  const services = Array.isArray(servicesPayload?.items)
    ? servicesPayload.items
    : Array.isArray(structure?.proServices)
      ? structure.proServices.filter(Boolean)
      : [];

  const selectedService =
    services.find((service) => String(service.id) === selectedServiceId) ||
    null;

  const {
    data: slotsPayload,
    isLoading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['public-rdv-slots', baseSlug, selectedServiceId, fromDate, toDate, isUserSession],
    enabled: Boolean(
      view === 'creneaux' &&
      baseSlug &&
      isRdvPublished &&
      isUserSession &&
      selectedServiceId,
    ),
    queryFn: () =>
      apiRequest(
        `/api/rdv/structures/${encodeURIComponent(baseSlug)}/slots?serviceId=${encodeURIComponent(selectedServiceId)}&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
        { token },
      ),
  });

  const {
    data: appointmentPayload,
    isLoading: appointmentLoading,
    error: appointmentError,
    refetch: refetchAppointment,
  } = useQuery({
    queryKey: ['public-rdv-appointment', appointmentId, isUserSession],
    enabled: Boolean(appointmentId && isUserSession),
    queryFn: () => apiRequest(`/api/rdv/appointments/${encodeURIComponent(appointmentId)}`, { token }),
  });

  const appointment = appointmentPayload && typeof appointmentPayload === 'object' ? appointmentPayload : null;

  const steps = useMemo(() => {
    return [
      {
        key: 'landing',
        label: 'Structure',
        description: 'Verification du contexte',
        href: `${basePath}${querySuffix}`,
      },
      {
        key: 'services',
        label: 'Service',
        description: 'Choix du motif',
        href: `${basePath}/services${querySuffix}`,
      },
      {
        key: 'creneaux',
        label: 'Creneau',
        description: 'Selection de la date',
        href: `${basePath}/creneaux${querySuffix}`,
      },
    ];
  }, [basePath, querySuffix]);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || typeof value === 'undefined' || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, { replace: true });
  };

  const handleChooseService = (serviceId) => {
    updateParams({ serviceId, appointment: null });
  };

  const handleBookSlot = async (slot) => {
    if (!selectedServiceId || !baseSlug || !slot?.startAt) return;

    setBookingBusy(true);
    setBookingError('');
    setBookingInfo('');

    const idempotencyKey =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      const payload = await apiRequest('/api/rdv/appointments', {
        method: 'POST',
        token,
        body: {
          structureSlug: baseSlug,
          serviceId: selectedServiceId,
          startAt: slot.startAt,
          idempotencyKey,
        },
      });

      if (payload?.id) {
        updateParams({ appointment: payload.id });
        setBookingInfo('RDV confirme. Un email de confirmation a ete prepare.');
        await refetchAppointment();
      }
    } catch (error) {
      if (error?.status === 409) {
        setBookingError("Ce creneau n'est plus disponible. Rechargez la liste.");
        await refetchSlots();
        return;
      }

      if (error?.status === 403 && error?.payload?.code === 'EMAIL_NOT_VERIFIED') {
        setBookingError('Veuillez verifier votre email avant de confirmer un rendez-vous.');
        return;
      }

      setBookingError(getErrorMessage(error, 'Impossible de confirmer ce rendez-vous.'));
    } finally {
      setBookingBusy(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment?.id) return;

    setCancelBusy(true);
    setBookingError('');
    setBookingInfo('');

    try {
      await apiRequest(`/api/rdv/appointments/${encodeURIComponent(appointment.id)}/cancel`, {
        method: 'POST',
        token,
      });
      await refetchAppointment();
      setBookingInfo('Rendez-vous annule.');
    } catch (error) {
      setBookingError(getErrorMessage(error, "Impossible d'annuler ce rendez-vous."));
    } finally {
      setCancelBusy(false);
    }
  };

  if (structureLoading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <SEO title="Structure introuvable" description="Prise de rendez-vous" path={safeNext} noindex={true} />
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Cette structure n&apos;existe pas</CardTitle>
            <CardDescription>
              Verifiez l&apos;adresse ou revenez a l&apos;annuaire pour choisir une autre structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              to="/annuaire"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Retour a l&apos;annuaire
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              Signaler un probleme
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authState?.authenticated) {
    return <Navigate to={appendNext('/auth/login', safeNext)} replace />;
  }

  if (!isRdvPublished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <SEO
          title="RDV indisponible"
          description="La prise de rendez-vous n'est pas publiee pour cette structure."
          path={safeNext}
          noindex={true}
        />
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              RDV indisponible (non publie)
            </CardTitle>
            <CardDescription>
              La structure <strong>{structure.nom}</strong> n&apos;a pas encore publie la prise de rendez-vous en ligne.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Vous pouvez demander a etre rappelle, ou inviter la structure a activer les rendez-vous en ligne.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Demander &agrave; &ecirc;tre rappel&eacute;
              </Link>
              <Link
                to="/proposer-une-structure"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                Inviter la structure
              </Link>
              <Link
                to={structure.slug ? `/structures/${structure.slug}` : '/annuaire'}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Retour a la structure
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isUserSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <SEO
          title="Connexion necessaire"
          description="Connectez-vous avec un compte particulier pour prendre rendez-vous."
          path={safeNext}
          noindex={true}
        />
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Connexion particulier necessaire</CardTitle>
            <CardDescription>
              Cette etape est reservee aux comptes particuliers (usagers).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              to={appendNext('/auth/login', safeNext)}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Se connecter
            </Link>
            <Link
              to={appendNext('/auth/signup', safeNext)}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              Creer un compte
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = view;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <SEO
        title={`Prise de RDV - ${structure.nom}`}
        description="Parcours de rendez-vous en ligne"
        path={safeNext}
        noindex={true}
      />

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prise de rendez-vous</h1>
            <p className="text-slate-600">{structure.nom}</p>
          </div>
          <Link
            to={structure.slug ? `/structures/${structure.slug}` : '/annuaire'}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Retour a la fiche structure
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="p-5">
            <ol className="grid gap-3 md:grid-cols-3" aria-label="Progression du parcours rendez-vous">
              {steps.map((step) => {
                const isCurrent = step.key === currentStep;
                return (
                  <li key={step.key}>
                    <Link
                      to={step.href}
                      className={`block rounded-lg border p-3 transition ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide">{step.label}</div>
                      <div className="text-sm">{step.description}</div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-6">
            {currentStep === 'landing' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Commencer votre demande</h2>
                <p className="text-slate-700">
                  Choisissez un service puis un creneau disponible pour obtenir une confirmation immediate.
                </p>
                <Link
                  to={`${basePath}/services${querySuffix}`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Choisir un service
                </Link>
              </div>
            )}

            {currentStep === 'services' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Choix du service</h2>

                {servicesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement des services...
                  </div>
                ) : services.length > 0 ? (
                  <ul className="space-y-2">
                    {services.map((service) => {
                      const selected = String(service.id) === selectedServiceId;
                      return (
                        <li key={service.id} className={`rounded-md border p-3 ${selected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-900">{service.name}</p>
                              <p className="text-sm text-slate-600">Duree: {service.durationMinutes || 30} min</p>
                            </div>
                            <Button
                              type="button"
                              variant={selected ? 'default' : 'outline'}
                              data-testid={`choose-service-${service.id}`}
                              onClick={() => handleChooseService(service.id)}
                            >
                              {selected ? 'Selectionne' : 'Choisir ce service'}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-slate-600">Aucun service n&apos;est actuellement publie pour cette structure.</p>
                )}

                {servicesError ? (
                  <p className="text-sm text-rose-700">{getErrorMessage(servicesError, 'Impossible de charger les services.')}</p>
                ) : null}

                <Link
                  to={`${basePath}/creneaux${querySuffix}`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Voir les creneaux
                </Link>
              </div>
            )}

            {currentStep === 'creneaux' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Choix du creneau</h2>

                {!selectedServiceId ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Selectionnez d&apos;abord un service.
                    <div className="mt-2">
                      <Link to={`${basePath}/services${querySuffix}`} className="underline">
                        Retour aux services
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="space-y-1 text-sm">
                        <span className="text-slate-700">Du</span>
                        <Input
                          type="date"
                          value={fromDate}
                          onChange={(event) => {
                            setFromDate(event.target.value);
                            updateParams({ from: event.target.value });
                          }}
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="text-slate-700">Au</span>
                        <Input
                          type="date"
                          value={toDate}
                          onChange={(event) => {
                            setToDate(event.target.value);
                            updateParams({ to: event.target.value });
                          }}
                        />
                      </label>

                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={() => refetchSlots()}>
                          Recharger les creneaux
                        </Button>
                      </div>
                    </div>

                    {selectedService ? (
                      <p className="text-sm text-slate-600">
                        Service selectionne: <strong>{selectedService.name}</strong>
                      </p>
                    ) : null}

                    {slotsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" /> Chargement des creneaux...
                      </div>
                    ) : null}

                    {!slotsLoading && slotsPayload?.days?.length > 0 ? (
                      <div className="space-y-4">
                        {slotsPayload.days.map((day) => (
                          <div key={day.date} className="rounded-md border border-slate-200 p-3">
                            <p className="mb-2 font-medium text-slate-900">{day.date}</p>
                            <div className="flex flex-wrap gap-2">
                              {day.slots.map((slot) => (
                                <Button
                                  key={slot.startAt}
                                  type="button"
                                  variant="outline"
                                  data-testid={`rdv-slot-${String(slot.startAt).replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  disabled={bookingBusy}
                                  onClick={() => handleBookSlot(slot)}
                                >
                                  {formatDateTime(slot.startAt)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {!slotsLoading && (!slotsPayload?.days || slotsPayload.days.length === 0) ? (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        Aucun creneau disponible sur la periode selectionnee.
                      </div>
                    ) : null}

                    {slotsError ? (
                      <p className="text-sm text-rose-700">{getErrorMessage(slotsError, 'Impossible de charger les creneaux.')}</p>
                    ) : null}
                  </>
                )}

                {bookingError ? (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{bookingError}</div>
                ) : null}

                {bookingInfo ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {bookingInfo}
                    </div>
                  </div>
                ) : null}

                {appointmentLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement du rendez-vous...
                  </div>
                ) : null}

                {appointmentError ? (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {getErrorMessage(appointmentError, 'Impossible de charger le rendez-vous.')}
                  </div>
                ) : null}

                {appointment ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 space-y-3" data-testid="rdv-booking-confirmation">
                    <h3 className="font-semibold text-emerald-900">RDV confirme</h3>
                    <p className="text-sm text-emerald-900">
                      {appointment.service?.name || 'Service'} - {formatDateTime(appointment.startsAt)}
                    </p>
                    <p className="text-xs text-emerald-900">Statut: {appointment.status}</p>

                    {appointment.status !== 'CANCELLED' ? (
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={cancelBusy}
                        onClick={handleCancelAppointment}
                      >
                        {cancelBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Annuler mon RDV
                      </Button>
                    ) : (
                      <p className="text-sm text-slate-700">Ce rendez-vous est annule.</p>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Ces informations sont fournies a titre indicatif. La confirmation finale depend de la disponibilite du creneau au moment de la validation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
