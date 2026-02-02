import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import NotFound from "./NotFound";
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  FileText,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';

export default function RessourceDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const identifier = slug || id;

  const fetchRessource = async () => {
     let url = `/api/ressources?`;
     if (slug) url += `slug=${slug}`;
     else if (id) url += `id=${id}`;

     const res = await fetch(url);
     if (!res.ok) {
         if (res.status === 404) return null;
         throw new Error('Failed to fetch');
     }
     return res.json();
  };

  const { data: ressource, isLoading } = useQuery({
    queryKey: ['ressource', identifier],
    queryFn: fetchRessource,
    enabled: !!identifier
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ressource) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={ressource.title}
        description={ressource.content?.substring(0, 150)}
        url={window.location.href}
      />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/ressources" className="hover:text-blue-600">Ressources</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 truncate max-w-[200px]">{ressource.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/ressources"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux ressources
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
                 {ressource.type && (
                     <Badge className="bg-blue-100 text-blue-800">
                         {ressource.type}
                     </Badge>
                 )}
                 {ressource.territory_scope && (
                    <Badge variant="outline">
                        {ressource.territory_scope}
                    </Badge>
                 )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {ressource.title}
            </h1>
        </div>

        {/* Content */}
        {ressource.content && (
            <Card className="mb-6">
                <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Contenu
                    </h2>
                    <div className="prose max-w-none text-slate-700">
                        {ressource.content}
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Source Traceability */}
        {ressource.source_url && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900">
                        <LinkIcon className="h-5 w-5" />
                        Source et traçabilité
                    </h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="font-medium text-blue-900 min-w-[120px]">Source :</span>
                            <a 
                                href={ressource.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 break-all"
                            >
                                {ressource.source_url}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                        </div>
                        {ressource.createdAt && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-700" />
                                <span className="font-medium text-blue-900">Ajouté le :</span>
                                <span className="text-blue-700">
                                    {new Date(ressource.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        )}
                        {ressource.updatedAt && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-700" />
                                <span className="font-medium text-blue-900">Mis à jour le :</span>
                                <span className="text-blue-700">
                                    {new Date(ressource.updatedAt).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )}

        {/* External Link */}
        {ressource.source_url && (
            <div className="flex justify-center">
                <Button asChild size="lg" className="gap-2">
                    <a href={ressource.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Consulter la source
                    </a>
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
