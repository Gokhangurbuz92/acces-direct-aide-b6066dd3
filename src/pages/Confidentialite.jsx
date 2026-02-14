
export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Politique de confidentialité
        </h1>

        <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-200 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Notre engagement
            </h2>
            <p className="text-slate-700 mb-4">
              AccesDirectAide est un site non lucratif. Nous ne vendons, 
              ne louons et ne partageons aucune donnée personnelle avec des tiers 
              à des fins commerciales.
            </p>
            <p className="text-slate-700">
              La protection de votre vie privée est une priorité absolue.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Données collectées
            </h2>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-4">
              1. Navigation sur le site
            </h3>
            <p className="text-slate-700 mb-4">
              Lorsque vous consultez le site, nous ne collectons aucune donnée 
              personnelle identifiable. La navigation est entièrement libre et anonyme.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-4">
              2. Formulaire de contact
            </h3>
            <p className="text-slate-700 mb-4">
              Si vous utilisez notre formulaire de contact, nous collectons :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li>Votre adresse email (obligatoire)</li>
              <li>Votre nom (facultatif)</li>
              <li>Le contenu de votre message</li>
            </ul>
            <p className="text-slate-700">
              Ces données sont utilisées uniquement pour répondre à votre demande 
              et ne sont jamais partagées.
            </p>

            <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-4">
              3. Assistant conversationnel (chatbot)
            </h3>
            <p className="text-slate-700 mb-4">
              Les conversations avec notre assistant sont temporaires et anonymes. 
              Elles ne sont pas associées à votre identité et sont supprimées 
              régulièrement.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-900 font-semibold mb-2">
                ⚠️ Important à savoir sur l'assistant
              </p>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• L'assistant peut se tromper et ne remplace pas un professionnel</li>
                <li>• Ne partagez jamais de données sensibles (numéro de sécurité sociale, mot de passe, coordonnées bancaires)</li>
                <li>• Les réponses sont informatives uniquement, pas de conseils personnalisés</li>
                <li>• En cas de doute, vérifiez toujours auprès de l'organisme concerné</li>
              </ul>
            </div>
            <p className="text-slate-700">
              Les conversations sont stockées temporairement (30 jours maximum) 
              uniquement pour améliorer le service. Aucune donnée n'est revendue 
              ou partagée à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Cookies
            </h2>
            <p className="text-slate-700 mb-4">
              Ce site utilise uniquement des cookies techniques nécessaires au 
              bon fonctionnement (préférences d'accessibilité, session de navigation).
            </p>
            <p className="text-slate-700">
              Nous n'utilisons pas de cookies publicitaires ou de suivi marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Vos droits (RGPD)
            </h2>
            <p className="text-slate-700 mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="text-slate-700">
              Pour exercer ces droits, contactez-nous via notre{' '}
              <a href="/contact" className="text-blue-600 hover:underline">
                formulaire de contact
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Sécurité
            </h2>
            <p className="text-slate-700">
              Vos données sont hébergées sur des serveurs sécurisés. Nous mettons 
              en œuvre toutes les mesures techniques nécessaires pour protéger 
              vos informations contre tout accès non autorisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Durée de conservation
            </h2>
            <p className="text-slate-700">
              Les messages de contact sont conservés 12 mois maximum puis supprimés. 
              Les logs techniques sont conservés 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Modifications
            </h2>
            <p className="text-slate-700">
              Cette politique de confidentialité peut être mise à jour. La dernière 
              version est toujours disponible sur cette page.
            </p>
            <p className="text-sm text-slate-500 mt-4">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}