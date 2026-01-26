import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function DemarcheCard({ demarche }) {
  const targetUrl = demarche.slug ? `/demarches/${demarche.slug}` : `/demarches/view?id=${demarche.id}`;

  return (
    <Card className="hover:shadow-md transition-all border-slate-200 overflow-hidden group relative bg-white">
      <Link
        to={targetUrl}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        aria-label={`Voir la démarche ${demarche.titre}`}
      >
         <span className="sr-only">Voir la démarche {demarche.titre}</span>
      </Link>

      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <Badge variant="outline" className="bg-slate-50">
              {demarche.category?.label || demarche.categorie}
            </Badge>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2">
            {demarche.titre}
          </h3>
          <p className="text-slate-600 text-sm line-clamp-2 mb-6">
            {demarche.summary_falc || demarche.description_courte}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {demarche.delai && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {demarche.delai}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Guide pas à pas
            </span>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
          <div
            className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:text-blue-800 transition-colors"
          >
            Démarrer la démarche
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
