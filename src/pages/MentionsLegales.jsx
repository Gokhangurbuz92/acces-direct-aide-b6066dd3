import React from 'react';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Mentions légales
        </h1>

        <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-200 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Éditeur du site
            </h2>
            <p className="text-slate-700">
              <strong>Nom du site :</strong> AccesDirectAide<br />
              <strong>Nature :</strong> Site d'information non lucratif<br />
              <strong>Territoire couvert :</strong> Alsace (Bas-Rhin 67, Haut-Rhin 68) et aides nationales
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Hébergement
            </h2>
            <p className="text-slate-700">
              Ce site est hébergé sur la plateforme Vercel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Objet du site
            </h2>
            <p className="text-slate-700 mb-4">
              AccesDirectAide a pour objectif de faciliter l'accès à l'information
              sur les aides sociales, les démarches administratives et les structures
              d'accompagnement en Alsace.
            </p>
            <p className="text-slate-700">
              Le site fournit des informations à caractère général et ne remplace pas
              les conseils personnalisés d'un professionnel ou d'une administration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Propriété intellectuelle
            </h2>
            <p className="text-slate-700 mb-4">
              Le contenu de ce site (textes, structure, présentation) est protégé
              par les droits d'auteur.
            </p>
            <p className="text-slate-700">
              Les informations proviennent de sources officielles publiques et sont
              reformulées en langage facile pour une meilleure accessibilité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Responsabilité
            </h2>
            <p className="text-slate-700 mb-4">
              Nous mettons tout en œuvre pour proposer des informations exactes et à jour.
              Toutefois, nous ne pouvons garantir l'exhaustivité ou l'absence d'erreur.
            </p>
            <p className="text-slate-700">
              En cas de doute, nous vous recommandons de toujours vérifier auprès
              de l'organisme concerné ou de consulter directement les sources officielles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Liens externes
            </h2>
            <p className="text-slate-700">
              Ce site contient des liens vers des sites externes. Nous ne sommes pas
              responsables du contenu de ces sites tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Contact
            </h2>
            <p className="text-slate-700">
              Pour toute question concernant ces mentions légales ou le fonctionnement
              du site, vous pouvez nous contacter via notre{' '}
              <a href="/contact" className="text-blue-600 hover:underline">
                formulaire de contact
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}