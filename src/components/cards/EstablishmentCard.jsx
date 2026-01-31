import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function EstablishmentCard({ establishment, compact = false }) {
  return (
    <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow" data-testid="establishment-card">
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="flex flex-col gap-3">
          {/* Nom */}
          <h4 className={`font-semibold text-slate-900 ${compact ? 'text-base' : 'text-lg'}`}>
            {establishment.nom}
          </h4>

          {/* Infos de contact */}
          <div className="space-y-2 text-sm text-slate-600">
            {/* Adresse */}
            {establishment.adresse && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  {establishment.adresse}
                  {establishment.code_postal && establishment.ville && (
                    <>, {establishment.code_postal} {establishment.ville}</>
                  )}
                  {establishment.departement && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {establishment.departement}
                    </Badge>
                  )}
                </span>
              </div>
            )}

            {/* Téléphone */}
            {establishment.telephone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <a
                  href={`tel:${establishment.telephone}`}
                  className="text-blue-600 hover:underline"
                >
                  {establishment.telephone}
                </a>
              </div>
            )}

            {/* Email */}
            {establishment.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <a
                  href={`mailto:${establishment.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {establishment.email}
                </a>
              </div>
            )}

            {/* Horaires */}
            {establishment.horaires && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <span>{establishment.horaires}</span>
              </div>
            )}
          </div>

          {/* Services */}
          {establishment.services && establishment.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {establishment.services.map((service, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          )}

          {/* Source URL */}
          {establishment.source_url && (
            <div className="mt-2">
              <a
                href={establishment.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Source
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
