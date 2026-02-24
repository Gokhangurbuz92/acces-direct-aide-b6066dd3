import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import NotFound from "./NotFound";
import { createPageUrl } from '@/utils';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Accessibility,
  ChevronRight,
  ExternalLink,
  Calendar,
  Loader2
} from 'lucide-react';
import { generateBreadcrumbSchema, generateStructureSchema } from '@/utils/schema';
import ProvenanceFreshness from '@/components/ProvenanceFreshness';
import FalcSummary from '@/components/FalcSummary';
import FalcToggle from '@/components/FalcToggle';
import FalcContent from '@/components/FalcContent';
import { getProvenance } from '@/lib/provenance';
import { buildPublicRdvPath } from '@/lib/rdvRouting';

const TYPE_LABELS = {
  association: 'Association',
  service_public: 'Service public',
  etablissement_sante: 'Établissement de santé',
  mairie: 'Mairie',
  caf: 'CAF',
  mdph: 'MDPH',
  france_travail: 'France Travail',
  cpam: 'CPAM',
  ccas: 'CCAS',
  ehpad: 'EHPAD',
  france_services: 'France Services',
  carsat: 'CARSAT',
  mission_locale: 'Mission Locale',
  pmi: 'PMI',
};

export default function StructureDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const structureId = searchParams.get('id');

  // FALC mode state
  const [isFalcMode, setIsFalcMode] = useState(false);

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['structure', slug || structureId],
    queryFn: () => client.entities.Structure.filter(slug ? { slug } : { id: structureId }),
    // API now returns single object for id/slug queries
    enabled: !!slug || !!structureId
  });

  const structure = Array.isArray(queryData)
    ? queryData[0]
    : (queryData?.items ? queryData?.items[0] : queryData);

  // Canonical Redirect: If accessed via ID but slug exists, redirect to slug URL
  useEffect(() => {
    if (structure && !slug && structure.slug) {
      navigate(`/structures/${structure.slug}`, { replace: true });
    }
  }, [structure, slug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!structure) {
    return <NotFound />;
  }

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: 'Annuaire', url: '/annuaire' },
    { name: structure.nom, url: `/structures/${structure.slug}` }
  ];

  const schema = [
    generateBreadcrumbSchema(breadcrumbs),
    generateStructureSchema(structure)
  ].filter(Boolean);
  const provenance = getProvenance(structure);
  const rdvPath = buildPublicRdvPath(structure);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={structure.nom}
        description={structure.description_courte || `Détails de ${structure.nom}`}
        path={`/structures/${structure.slug}`}
        schema={schema}
      />
      {/* Fil d'Ariane */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/annuaire" className="hover:text-blue-600">Annuaire</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900">{structure.nom}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Retour */}
        <Link
          to="/annuaire"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'annuaire
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* En-tête */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {TYPE_LABELS[structure.type_structure] && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {TYPE_LABELS[structure.type_structure]}
                    </Badge>
                  )}
                  {structure.accessibilite_pmr && (
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      <Accessibility className="h-3 w-3 mr-1" />
                      Accessible PMR
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  {structure.nom}
                </h1>

                {structure.description_courte && (
                  <p className="text-slate-600 text-lg">
                    {structure.description_courte}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* FALC Toggle */}
            <div className="mb-4">
              <FalcToggle
                hasFalcContent={!!(structure?.resume_falc || structure?.summary_falc || structure?.description_falc)}
                onChange={setIsFalcMode}
              />
            </div>

            {isFalcMode ? (
              <Card>
                <CardContent className="p-6">
                  <FalcContent falcData={structure} entityType="structure" />
                </CardContent>
              </Card>
            ) : (
              <>
                {/* FALC Summary */}
                <FalcSummary text={structure?.resume_falc || structure?.summary_falc || structure?.description_falc} />

                {/* Coordonnées */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Coordonnées</h2>
                    <div className="space-y-4">
                      {structure.adresse && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-900">Adresse</p>
                            <p className="text-slate-600">
                              {structure.adresse}<br />
                              {structure.code_postal} {structure.ville}
                            </p>
                          </div>
                        </div>
                      )}

                      {structure.telephone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-900">Téléphone</p>
                            <a
                              href={`tel:${structure.telephone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {structure.telephone}
                            </a>
                          </div>
                        </div>
                      )}

                      {structure.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-900">Email</p>
                            <a
                              href={`mailto:${structure.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {structure.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {structure.site_web && (
                        <div className="flex items-start gap-3">
                          <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-900">Site web</p>
                            <a
                              href={structure.site_web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Visiter le site
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {structure.horaires && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-900">Horaires</p>
                            <p className="text-slate-600 whitespace-pre-line">
                              {structure.horaires}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Services */}
                {structure.services?.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-4">Services proposés</h2>
                      <div className="flex flex-wrap gap-2">
                        {structure.services.map((service, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pro Services (Lot 4) */}
                {structure.is_pro_enabled && (
                  <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Prendre rendez-vous
                      </h2>
                      <p className="text-slate-700 mb-4">
                        Cette structure propose la prise de rendez-vous en ligne.
                      </p>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700" asChild>
                        <Link to={rdvPath}>
                          Voir les créneaux disponibles
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Publics accueillis */}
                {structure.publics_accueillis?.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-slate-900 mb-4">Publics accueillis</h2>
                      <div className="flex flex-wrap gap-2">
                        {structure.publics_accueillis.map((public_, idx) => (
                          <Badge key={idx} variant="outline" className="border-slate-300 text-slate-700">
                            {public_}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProvenanceFreshness provenance={provenance} />

            {/* Actions rapides */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {structure.is_pro_enabled ? (
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700" asChild>
                    <Link to={rdvPath}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Prendre rendez-vous
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link to={rdvPath}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Demander un RDV
                    </Link>
                  </Button>
                )}

                {structure.telephone && (
                  <Button className="w-full" asChild>
                    <a href={`tel:${structure.telephone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Appeler
                    </a>
                  </Button>
                )}
                {structure.site_web && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={structure.site_web} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Visiter le site
                    </a>
                  </Button>
                )}
                {structure.email && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${structure.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer un email
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Informations */}
            <Card className="bg-slate-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Informations</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-medium">Département :</span>{' '}
                    {structure.departement === '67' ? 'Bas-Rhin' :
                      structure.departement === '68' ? 'Haut-Rhin' : structure.departement}
                  </p>
                  {structure.date_verification && (
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Vérifié le {new Date(structure.date_verification).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
