import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import NotFound from "./NotFound";
import Gone from "./Gone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { buildAideDetailSchemas, truncateDescription } from '@/lib/seo';
import ProvenanceFreshness from '@/components/ProvenanceFreshness';
import FalcSummary from '@/components/FalcSummary';
import FalcToggle from '@/components/FalcToggle';
import FalcContent from '@/components/FalcContent';
import FeedbackButton from '@/components/FeedbackButton';
import { formatProvenanceDate, getProvenance } from '@/lib/provenance';
import { useAideDetail } from '@/lib/hooks/useAideDetail';
import CategoryChip, { resolveCategory } from '@/components/ui/CategoryChip';



export default function AideDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // V2-03: Use useAideDetail hook instead of react-query + direct fetch
  // ------------------------------------------------------------------
  const { status, data, raw: aide, errorMessage, refetch } = useAideDetail(slug);

  // FALC mode state
  const [isFalcMode, setIsFalcMode] = useState(false);
  const hasFalcContent = !!(aide?.summary_falc || aide?.conditions_falc || aide?.montant_falc);

  // Canonical Redirect: If accessed via query ?id= but slug exists, redirect
  useEffect(() => {
    if (aide && !slug && aide.slug) {
      navigate(`/aides/${aide.slug}`, { replace: true });
    }
  }, [aide, slug, navigate]);

  // Structures sidebar (keep react-query — it's not aide data)
  const { data: structuresData } = useQuery({
    queryKey: ['structures-aide', aide?.categorie],
    queryFn: () => client.entities.Structure.filter({
      statut: 'actif'
    }, '-created_date', 5),
    enabled: !!aide?.categorie
  });

  const structures = Array.isArray(structuresData)
    ? structuresData
    : (structuresData?.items || []);

  const filteredStructures = structures.filter(s =>
    s.categories_aidees?.includes(aide?.categorie)
  ).slice(0, 3);

  // SEO
  const canonicalPath = aide?.slug ? `/aides/${aide.slug}` : (slug ? `/aides/${slug}` : '/aides');
  const seoTitle = aide?.titre || data?.title || 'Aide';
  const seoDescription = truncateDescription(
    aide?.summary_falc || aide?.cest_quoi || "Consultez le détail d'une aide sociale."
  ) || "Consultez le détail d'une aide sociale.";
  const schema = useMemo(
    () => buildAideDetailSchemas(aide, canonicalPath),
    [aide, canonicalPath]
  );

  // ------------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------------
  if (status === 'loading') {
    return (
      <>
        <SEO
          title={seoTitle}
          description={seoDescription}
          path={canonicalPath}
          ogType="article"
          schema={schema}
        />
        <div className="min-h-screen bg-slate-50">
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="h-4 w-32 mb-6" />
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 mb-6">
              <Skeleton className="h-6 w-20 mb-4" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map((v) => (
                  <div key={v} className="bg-white rounded-xl border border-slate-200 p-6">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ------------------------------------------------------------------
  // Error state
  // ------------------------------------------------------------------
  if (status === 'error') {
    return (
      <>
        <SEO
          title="Erreur — Aide"
          description="Une erreur est survenue."
          path={canonicalPath}
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div
            className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-destructive max-w-md text-center"
            role="alert"
            data-testid="aide-detail-error"
          >
            <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-60" />
            <h1 className="text-xl font-semibold mb-2">Impossible de charger cette aide</h1>
            <p className="text-sm mb-6">
              {errorMessage || 'Vérifiez votre connexion et réessayez.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button type="button" variant="outline" onClick={() => refetch()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/aides">Retour aux aides</Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ------------------------------------------------------------------
  // Not found state
  // ------------------------------------------------------------------
  if (status === 'not_found' || !aide) {
    return <NotFound />;
  }

  // ------------------------------------------------------------------
  // Success — render full detail
  // ------------------------------------------------------------------
  const categorySlug = (() => {
    const raw = aide?.categorie || aide?.theme || aide?.category?.slug;
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;
    return /^[A-Z_]+$/.test(value) ? value.toLowerCase() : value;
  })();

  const resolved = resolveCategory(categorySlug) || (aide?.category?.label ? { label: aide.category.label } : null);
  const categoryLabel = resolved?.label || null;
  const provenance = getProvenance(aide);
  const fetchedAtLabel = formatProvenanceDate(provenance.fetchedAt);
  const pdfDownloadUrl = (aide?.slug || aide?.id)
    ? `/api/pdf/aides/${encodeURIComponent(aide.slug || aide.id)}`
    : null;

  const getTerritoireLabel = () => {
    if (!aide.territoires?.length) return null;
    if (aide.territoires.includes('national')) return 'France entière';
    return aide.territoires.map(t => {
      if (t === '67') return 'Bas-Rhin (67)';
      if (t === '68') return 'Haut-Rhin (68)';
      return t;
    }).join(', ');
  };

  const territoireLabel = getTerritoireLabel();

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        ogType="article"
        schema={schema}
      />
      {/* Fil d'Ariane */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600" aria-label="Fil d'Ariane" data-testid="aide-breadcrumb">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={createPageUrl('Aides')} className="hover:text-blue-600">Aides</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900">{aide.titre}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Retour */}
        <Link
          to={createPageUrl('Aides')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux aides
        </Link>

        {/* En-tête */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {categoryLabel && <CategoryChip slug={categorySlug} label={categoryLabel} />}
            {aide.est_urgent && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Urgence
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            {aide.titre}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            {territoireLabel && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {territoireLabel}
              </span>
            )}
            {fetchedAtLabel && (
              <span className="flex items-center gap-1" title="Date de dernière mise à jour de la source">
                <Calendar className="h-4 w-4" />
                Mise à jour : {fetchedAtLabel}
              </span>
            )}
            {aide.delai_indicatif && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {aide.delai_indicatif}
              </span>
            )}
          </div>
        </div>

        {/* FALC Toggle */}
        <div className="mb-6">
          <FalcToggle
            hasFalcContent={hasFalcContent}
            onChange={setIsFalcMode}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {isFalcMode ? (
              /* FALC Mode Content */
              <Card>
                <CardContent className="p-6">
                  <FalcContent falcData={aide} entityType="aide" />
                </CardContent>
              </Card>
            ) : (
              /* Normal Mode Content */
              <>
                {/* C'est quoi ? */}
                {aide.cest_quoi && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-3">C&apos;est quoi ?</h2>
                      <p className="text-slate-700 leading-relaxed">{aide.cest_quoi}</p>
                    </CardContent>
                  </Card>
                )}

                {/* FALC Summary */}
                <FalcSummary text={aide?.summary_falc} />

                {/* Pour qui ? */}
                {aide.pour_qui && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-3">Pour qui ?</h2>
                      <p className="text-slate-700 leading-relaxed">{aide.pour_qui}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Ce que ça aide */}
                {aide.ce_que_ca_aide && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-3">Ce que ça peut aider</h2>
                      <p className="text-slate-700 leading-relaxed">{aide.ce_que_ca_aide}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Documents nécessaires */}
                {aide.documents_necessaires?.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-3">
                        <FileText className="inline h-5 w-5 mr-2" />
                        Documents à préparer
                      </h2>
                      <ul className="space-y-2">
                        {aide.documents_necessaires.map((doc, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Étapes */}
                {aide.etapes?.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-4">Étapes de la demande</h2>
                      <div className="space-y-4">
                        {aide.etapes.map((etape, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                              {etape.numero || idx + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{etape.titre}</h3>
                              <p className="text-slate-600 text-sm mt-1">{etape.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Où faire la demande */}
                {(aide.ou_demander || aide.lien_demande) && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-3">Où faire la demande ?</h2>
                      {aide.ou_demander && <p className="text-slate-700 mb-4">{aide.ou_demander}</p>}
                      {aide.lien_demande && (
                        <Button asChild>
                          <a href={aide.lien_demande} target="_blank" rel="noopener noreferrer">
                            Faire ma demande
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Sources — "Consulter la source officielle" */}
                {aide.source_url && (
                  <Card className="bg-slate-50">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-3">Sources</h2>
                      <ul className="space-y-2">
                        <li>
                          <a href={aide.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            Consulter la source officielle
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {aide.source_name && (
                            <span className="text-xs text-slate-500 ml-2">({aide.source_name})</span>
                          )}
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProvenanceFreshness provenance={provenance} />

            {/* Actions */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {aide.lien_demande && (
                  <Button className="w-full" asChild>
                    <a href={aide.lien_demande} target="_blank" rel="noopener noreferrer">
                      Faire ma demande
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {pdfDownloadUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(pdfDownloadUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger en PDF
                  </Button>
                )}
                <FeedbackButton
                  type="aide"
                  entityId={aide.id}
                  entitySlug={aide.slug}
                  pageUrl={typeof window !== 'undefined' ? window.location.href : null}
                  variant="ghost"
                  size="default"
                />
              </CardContent>
            </Card>

            {/* Structures locales */}
            {filteredStructures.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4">
                    Structures qui peuvent vous aider
                  </h3>
                  <div className="space-y-3">
                    {filteredStructures.map((struct) => (
                      <Link
                        key={struct.id}
                        to={struct.slug ? `/structures/${struct.slug}` : `/structures/view?id=${struct.id}`}
                        className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <p className="font-medium text-slate-900">{struct.nom}</p>
                        <p className="text-sm text-slate-600">{struct.ville}</p>
                      </Link>
                    ))}
                  </div>
                  <Link to="/structures">
                    <Button variant="link" className="mt-4 p-0">
                      Voir toutes les structures
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
