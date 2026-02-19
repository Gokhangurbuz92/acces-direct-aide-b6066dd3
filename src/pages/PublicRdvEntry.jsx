import { useMemo } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Loader2, ShieldAlert } from 'lucide-react';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
 * @param {{ view?: 'landing' | 'services' | 'creneaux' }} props
 */
export default function PublicRdvEntry({ view = 'landing' }) {
  const { structureSlug } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const structureId = String(searchParams.get('structureId') || '').trim();
  const token = getSessionToken();

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
    queryKey: ['public-rdv-auth', token ? 'token' : 'none'],
    enabled: true,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!token) {
        return { authenticated: false, sessionKind: null };
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }).catch(() => null);

      if (!response || !response.ok) {
        return { authenticated: false, sessionKind: null };
      }

      const payload = await response.json().catch(() => null);
      return {
        authenticated: true,
        sessionKind: payload?.session?.kind || null,
      };
    },
  });

  const structure = resolveStructure(structureData);
  const safeNext = normalizeNextPath(location.pathname + location.search, '/annuaire');

  const baseSlug = String(structure?.slug || structureSlug || '').trim();
  const basePath = baseSlug ? `/rdv/${encodeURIComponent(baseSlug)}` : '/annuaire';
  const querySuffix = structureId ? `?structureId=${encodeURIComponent(structureId)}` : '';

  const steps = useMemo(() => {
    return [
      {
        key: 'landing',
        label: 'Structure',
        description: 'Vérification du contexte',
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
        label: 'Créneau',
        description: 'Sélection de la date',
        href: `${basePath}/creneaux${querySuffix}`,
      },
    ];
  }, [basePath, querySuffix]);

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
              Vérifiez l&apos;adresse ou revenez à l&apos;annuaire pour choisir une autre structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              to="/annuaire"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Retour à l&apos;annuaire
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              Signaler un problème
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authState?.authenticated) {
    return <Navigate to={appendNext('/auth/login', safeNext)} replace />;
  }

  if (!structure.is_pro_enabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <SEO
          title="RDV indisponible"
          description="La prise de rendez-vous n'est pas activée pour cette structure."
          path={safeNext}
          noindex={true}
        />
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              RDV indisponible pour cette structure
            </CardTitle>
            <CardDescription>
              La structure <strong>{structure.nom}</strong> n&apos;a pas encore activé la prise de rendez-vous en ligne.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Vous pouvez demander à être rappelé, ou inviter la structure à activer les rendez-vous en ligne.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Demander à être rappelé
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
                Retour à la structure
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
  );
  }

  const services = Array.isArray(structure.proServices)
    ? structure.proServices.filter(Boolean)
    : [];

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
            Retour à la fiche structure
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
          <CardContent className="p-6">
            {currentStep === 'landing' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Commencer votre demande</h2>
                <p className="text-slate-700">
                  Le parcours public est prêt: choisissez votre service puis un créneau disponible.
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
                {services.length > 0 ? (
                  <ul className="space-y-2">
                    {services.map((/** @type {any} */ service) => (
                      <li key={service.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
                        {service.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600">Aucun service n&apos;est encore publié pour cette structure.</p>
                )}
                <Link
                  to={`${basePath}/creneaux${querySuffix}`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Voir les créneaux
                </Link>
              </div>
            )}

            {currentStep === 'creneaux' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Choix du créneau</h2>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="mb-2 flex items-center gap-2 font-medium text-slate-900">
                    <Clock3 className="h-4 w-4" />
                    Créneaux bientôt disponibles
                  </div>
                  <p>
                    Cette étape affiche le sélecteur de créneaux. Le parcours complet de confirmation arrive dans la prochaine livraison.
                  </p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Parcours préparé
                  </div>
                  <p>La structure est active et le flux public est correctement initialisé.</p>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-slate-500">
              Ces informations sont fournies à titre indicatif. Les confirmations définitives de rendez-vous seront activées à l&apos;étape suivante.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
