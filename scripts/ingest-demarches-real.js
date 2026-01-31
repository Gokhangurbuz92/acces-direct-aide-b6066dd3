/**
 * DÉMARCHES INGESTION SCRIPT
 * 
 * Ingests real French administrative procedures from curated official sources.
 * Focuses on Alsace-specific content when applicable.
 * 
 * CONTENT RULES:
 * - Plain French, short paragraphs, actionable
 * - Always store source deep link + retrieved_at
 * - Idempotent upserts (no duplicates via content_hash)
 * - Categorize coherently
 * 
 * SOURCES:
 * - service-public.fr (official French government portal)
 * - Local Alsace administrative pages when applicable
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper: Generate content hash for deduplication
function generateContentHash(data) {
  const content = JSON.stringify({
    titre: data.titre,
    pour_qui: data.pour_qui,
    etapes: data.etapes,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Helper: Slugify
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// CURATED DÉMARCHES DATA
// Each entry represents a real administrative procedure with precise sources
const demarchesData = [
  // ========== IDENTITÉ / MAIRIE ==========
  {
    titre: "Faire ou renouveler sa carte d'identité",
    categorie: "Identité",
    description_courte: "Obtenir ou renouveler votre carte nationale d'identité gratuitement en mairie équipée.",
    pour_qui: "Tout citoyen français, quel que soit son âge. Pour les mineurs, la présence d'un parent est obligatoire.",
    etapes: [
      {
        numero: 1,
        titre: "Pré-demande en ligne (optionnel)",
        description: "Rendez-vous sur le site de l'ANTS pour remplir votre pré-demande. Cela vous fera gagner du temps en mairie. Vous recevrez un numéro de pré-demande à noter."
      },
      {
        numero: 2,
        titre: "Prendre rendez-vous",
        description: "Prenez rendez-vous dans une mairie équipée d'un dispositif de recueil (pas forcément votre mairie de domicile). Vérifiez les mairies disponibles sur le site de l'ANTS."
      },
      {
        numero: 3,
        titre: "Se présenter en mairie",
        description: "Présentez-vous au rendez-vous avec tous vos documents. Vos empreintes digitales seront prises et votre photo sera prise sur place ou vous devrez fournir une e-photo."
      },
      {
        numero: 4,
        titre: "Retrait de la carte",
        description: "Vous serez averti par SMS ou email quand votre carte sera disponible. Vous avez 3 mois pour la retirer en mairie."
      }
    ],
    documents_necessaires: [
      "Photo d'identité de moins de 6 mois aux normes",
      "Justificatif de domicile de moins de 1 an",
      "Ancienne carte d'identité (si renouvellement) ou déclaration de perte/vol",
      "Acte de naissance de moins de 3 mois (si première demande ou perte)",
      "Numéro de pré-demande (si pré-demande en ligne effectuée)"
    ],
    delai: "Environ 3 à 8 semaines selon l'affluence. Peut être plus long en période estivale.",
    cout: "Gratuit pour un renouvellement ou une première demande. 25€ en cas de perte ou vol.",
    ou_faire: "Mairie équipée d'un dispositif de recueil des empreintes. Liste disponible sur le site de l'ANTS.",
    lien_officiel: "https://passeport.ants.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/N358",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers"],
    mots_cles: ["cni", "identité", "carte", "mairie", "ants"],
    statut: "publie"
  },
  {
    titre: "Demander un passeport biométrique",
    categorie: "Identité",
    description_courte: "Obtenir un passeport pour voyager à l'étranger. Démarche payante à effectuer en mairie équipée.",
    pour_qui: "Tout citoyen français souhaitant voyager hors de l'espace Schengen. Obligatoire pour les voyages hors Europe.",
    etapes: [
      {
        numero: 1,
        titre: "Acheter un timbre fiscal",
        description: "Achetez un timbre fiscal dématérialisé sur le site timbres.impots.gouv.fr. Le montant est de 86€ pour un adulte, 42€ pour un mineur de 15 à 17 ans, 17€ pour un mineur de moins de 15 ans."
      },
      {
        numero: 2,
        titre: "Pré-demande en ligne",
        description: "Remplissez votre pré-demande sur le site de l'ANTS. Vous recevrez un numéro de pré-demande à conserver."
      },
      {
        numero: 3,
        titre: "Rendez-vous en mairie",
        description: "Prenez rendez-vous dans une mairie équipée. Présentez-vous avec tous vos documents. Vos empreintes seront prises."
      },
      {
        numero: 4,
        titre: "Retrait du passeport",
        description: "Vous serez averti par SMS/email. Retirez votre passeport en mairie dans les 3 mois. Présentez-vous avec votre ancienne carte d'identité ou passeport."
      }
    ],
    documents_necessaires: [
      "Timbre fiscal (86€ adulte, 42€ mineur 15-17 ans, 17€ moins de 15 ans)",
      "Photo d'identité aux normes de moins de 6 mois",
      "Justificatif de domicile de moins de 1 an",
      "Carte d'identité ou ancien passeport",
      "Numéro de pré-demande"
    ],
    delai: "4 à 10 semaines en moyenne. Peut être plus long en période de vacances.",
    cout: "86€ (adulte), 42€ (mineur 15-17 ans), 17€ (moins de 15 ans)",
    ou_faire: "Mairie équipée d'un dispositif de recueil. Consultez la liste sur ants.gouv.fr",
    lien_officiel: "https://passeport.ants.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/N360",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers"],
    mots_cles: ["passeport", "voyage", "mairie", "timbre fiscal", "ants"],
    statut: "publie"
  },
  {
    titre: "Inscription sur les listes électorales",
    categorie: "Citoyenneté",
    description_courte: "S'inscrire pour pouvoir voter aux élections. Démarche gratuite en ligne ou en mairie.",
    pour_qui: "Tout citoyen français majeur. Également les citoyens européens pour les élections municipales et européennes.",
    etapes: [
      {
        numero: 1,
        titre: "Vérifier son inscription",
        description: "Vérifiez d'abord si vous êtes déjà inscrit sur service-public.fr avec votre nom, prénom et date de naissance."
      },
      {
        numero: 2,
        titre: "Faire la demande",
        description: "Inscrivez-vous en ligne sur service-public.fr avec FranceConnect, ou déposez un formulaire Cerfa en mairie, ou envoyez-le par courrier."
      },
      {
        numero: 3,
        titre: "Confirmation",
        description: "Vous recevrez une confirmation d'inscription par courrier. Conservez-la précieusement."
      }
    ],
    documents_necessaires: [
      "Pièce d'identité en cours de validité",
      "Justificatif de domicile de moins de 3 mois"
    ],
    delai: "Inscription prise en compte rapidement. Pour voter à une élection, inscription avant le 6e vendredi précédant le scrutin.",
    cout: "Gratuit",
    ou_faire: "En ligne sur service-public.fr, en mairie, ou par courrier",
    lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/R16396",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F1367",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers"],
    mots_cles: ["vote", "élection", "mairie", "citoyen", "inscription"],
    statut: "publie"
  },
  {
    titre: "Recensement citoyen à 16 ans",
    categorie: "Citoyenneté",
    description_courte: "Obligation pour tous les jeunes Français de se faire recenser dans les 3 mois suivant leurs 16 ans.",
    pour_qui: "Tous les jeunes Français, garçons et filles, dans les 3 mois suivant leur 16e anniversaire.",
    etapes: [
      {
        numero: 1,
        titre: "Se présenter en mairie",
        description: "Allez à la mairie de votre domicile avec votre carte d'identité et le livret de famille."
      },
      {
        numero: 2,
        titre: "Recevoir l'attestation",
        description: "La mairie vous remet immédiatement une attestation de recensement. Conservez-la précieusement, elle est obligatoire pour passer le bac, le permis de conduire et tout concours public."
      }
    ],
    documents_necessaires: [
      "Carte d'identité ou passeport",
      "Livret de famille",
      "Justificatif de domicile"
    ],
    delai: "Immédiat. L'attestation est remise le jour même.",
    cout: "Gratuit",
    ou_faire: "Mairie du domicile",
    lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F870",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F870",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["jeunes"],
    mots_cles: ["16 ans", "jeune", "obligatoire", "attestation", "jdc"],
    statut: "publie"
  },

  // ========== ÉTRANGERS / PRÉFECTURE ==========
  {
    titre: "Première demande de titre de séjour",
    categorie: "Étrangers",
    description_courte: "Demander votre premier titre de séjour en France après votre arrivée avec un visa long séjour.",
    pour_qui: "Ressortissants étrangers hors UE arrivés en France avec un visa long séjour et souhaitant rester plus de 3 mois.",
    etapes: [
      {
        numero: 1,
        titre: "Prendre rendez-vous",
        description: "Consultez le site internet de la préfecture de votre département pour prendre rendez-vous. Certaines préfectures utilisent le site de l'ANEF."
      },
      {
        numero: 2,
        titre: "Préparer le dossier",
        description: "Rassemblez tous les documents originaux et leurs copies : passeport avec visa, justificatifs de ressources, de domicile, photos d'identité."
      },
      {
        numero: 3,
        titre: "Se présenter au guichet",
        description: "Présentez-vous au rendez-vous à la préfecture. L'agent vérifiera vos documents et prendra vos empreintes digitales."
      },
      {
        numero: 4,
        titre: "Récupérer le récépissé",
        description: "On vous remettra un récépissé de demande de titre de séjour. Ce document provisoire vous autorise à rester en France en attendant votre carte."
      },
      {
        numero: 5,
        titre: "Retrait du titre",
        description: "Vous serez convoqué pour retirer votre titre de séjour. Vous devrez payer les timbres fiscaux à ce moment-là."
      }
    ],
    documents_necessaires: [
      "Passeport avec visa long séjour en cours de validité",
      "Justificatif de domicile de moins de 6 mois",
      "3 photos d'identité aux normes",
      "Justificatifs de ressources (contrat de travail, bulletins de salaire, ou attestation de prise en charge)",
      "Acte de naissance avec traduction si nécessaire",
      "Justificatif d'assurance maladie"
    ],
    delai: "Variable selon les préfectures : de 2 à 6 mois en moyenne.",
    cout: "Gratuit pour le dépôt. Timbres fiscaux à payer lors du retrait (montant variable selon le type de titre : environ 225€ pour un titre de séjour classique).",
    ou_faire: "Préfecture ou sous-préfecture de votre domicile",
    lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/N110",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["étrangers"],
    mots_cles: ["préfecture", "titre de séjour", "étranger", "visa", "première demande"],
    statut: "publie"
  },
  {
    titre: "Renouveler son titre de séjour en ligne",
    categorie: "Étrangers",
    description_courte: "Renouveler votre titre de séjour via la plateforme ANEF, 2 à 4 mois avant son expiration.",
    pour_qui: "Ressortissants étrangers titulaires d'un titre de séjour arrivant à expiration.",
    etapes: [
      {
        numero: 1,
        titre: "Se connecter à l'ANEF",
        description: "Rendez-vous sur administration-etrangers-en-france.interieur.gouv.fr. Créez votre compte ou connectez-vous avec votre numéro d'étranger."
      },
      {
        numero: 2,
        titre: "Choisir la démarche",
        description: "Sélectionnez 'Je demande ou je renouvelle un titre de séjour' puis choisissez le motif correspondant à votre situation."
      },
      {
        numero: 3,
        titre: "Télécharger les documents",
        description: "Scannez et téléchargez tous les justificatifs demandés : e-photo, justificatif de domicile, ressources, etc."
      },
      {
        numero: 4,
        titre: "Valider la demande",
        description: "Vérifiez toutes les informations et validez. Vous recevrez une attestation de dépôt par email. Conservez-la précieusement."
      },
      {
        numero: 5,
        titre: "Suivi et retrait",
        description: "Suivez l'avancement de votre dossier en ligne. Vous serez convoqué en préfecture pour le retrait de votre nouveau titre."
      }
    ],
    documents_necessaires: [
      "Titre de séjour actuel",
      "e-Photo d'identité numérique (signature électronique)",
      "Justificatif de domicile de moins de 6 mois",
      "Justificatifs de ressources (3 derniers bulletins de salaire ou avis d'imposition)",
      "Justificatif d'assurance maladie"
    ],
    delai: "Variable selon les préfectures : 2 à 6 mois. Commencez la démarche 2 à 4 mois avant l'expiration.",
    cout: "Timbres fiscaux à acheter en ligne (montant variable : environ 225€ pour un titre classique)",
    ou_faire: "En ligne sur le site de l'ANEF",
    lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F2231",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["étrangers"],
    mots_cles: ["préfecture", "titre de séjour", "renouvellement", "anef", "en ligne"],
    statut: "publie"
  },
  {
    titre: "Demander la nationalité française par naturalisation",
    categorie: "Étrangers",
    description_courte: "Devenir citoyen français après 5 ans de résidence régulière en France.",
    pour_qui: "Ressortissants étrangers majeurs résidant en France depuis au moins 5 ans de manière régulière et continue.",
    etapes: [
      {
        numero: 1,
        titre: "Vérifier les conditions",
        description: "Assurez-vous de remplir toutes les conditions : 5 ans de résidence, niveau B1 en français, connaissance de l'histoire et des valeurs de la France, insertion professionnelle."
      },
      {
        numero: 2,
        titre: "Rassembler les documents",
        description: "Préparez tous les actes d'état civil traduits en français par un traducteur assermenté, diplômes, justificatifs de résidence, etc."
      },
      {
        numero: 3,
        titre: "Déposer la demande en ligne",
        description: "Créez votre dossier sur le site de l'ANEF et téléchargez tous vos justificatifs."
      },
      {
        numero: 4,
        titre: "Entretien de naturalisation",
        description: "Vous serez convoqué en préfecture pour un entretien individuel. On vérifiera votre niveau de français et vos connaissances sur la France."
      },
      {
        numero: 5,
        titre: "Décision et cérémonie",
        description: "Si votre demande est acceptée, vous serez convié à une cérémonie d'accueil dans la citoyenneté française."
      }
    ],
    documents_necessaires: [
      "Acte de naissance avec traduction assermentée",
      "Diplôme de langue française niveau B1 (TCF, DELF, etc.)",
      "Justificatifs de résidence des 5 dernières années",
      "Avis d'imposition des 3 dernières années",
      "Casier judiciaire du pays d'origine",
      "Bordereau fiscal P237 (timbre de 55€)"
    ],
    delai: "Très long : entre 18 mois et 2 ans en moyenne.",
    cout: "55€ de timbre fiscal",
    ou_faire: "En ligne sur le site de l'ANEF, puis entretien en préfecture",
    lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F2213",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["étrangers"],
    mots_cles: ["nationalité", "français", "naturalisation", "citoyen", "préfecture"],
    statut: "publie"
  },

  // ========== CAF / SOCIAL ==========
  {
    titre: "Demander le RSA (Revenu de Solidarité Active)",
    categorie: "Social",
    description_courte: "Obtenir un revenu minimum si vous avez plus de 25 ans et peu ou pas de ressources.",
    pour_qui: "Personnes de plus de 25 ans (ou moins de 25 ans avec enfant à charge ou femme enceinte) ayant de faibles ressources.",
    etapes: [
      {
        numero: 1,
        titre: "Faire une simulation",
        description: "Rendez-vous sur caf.fr pour simuler vos droits et vérifier si vous êtes éligible au RSA."
      },
      {
        numero: 2,
        titre: "Créer un compte CAF",
        description: "Si vous n'avez pas encore de compte CAF, créez-le sur caf.fr avec votre numéro de sécurité sociale."
      },
      {
        numero: 3,
        titre: "Remplir la demande en ligne",
        description: "Complétez le formulaire de demande de RSA en ligne. Vous devrez fournir des informations sur votre situation familiale, vos ressources, votre logement."
      },
      {
        numero: 4,
        titre: "Envoyer les justificatifs",
        description: "Téléchargez ou envoyez par courrier tous les documents demandés : RIB, justificatifs de ressources, avis d'imposition, etc."
      },
      {
        numero: 5,
        titre: "Déclarations trimestrielles",
        description: "Une fois le RSA accordé, vous devrez déclarer vos ressources tous les 3 mois sur caf.fr pour continuer à percevoir l'aide."
      }
    ],
    documents_necessaires: [
      "RIB à votre nom",
      "Justificatifs de ressources des 3 derniers mois (bulletins de salaire, attestation Pôle emploi)",
      "Avis d'imposition ou de non-imposition",
      "Justificatif de domicile",
      "Titre de séjour en cours de validité (pour les étrangers)"
    ],
    delai: "Environ 1 mois après le dépôt complet du dossier. Premier versement rétroactif au 1er jour du mois de la demande.",
    cout: "Gratuit",
    ou_faire: "En ligne sur caf.fr ou à votre CAF locale",
    lien_officiel: "https://www.caf.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/N19775",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers", "demandeurs"],
    mots_cles: ["rsa", "argent", "aide", "caf", "revenu minimum"],
    statut: "publie"
  },
  {
    titre: "Demander la Prime d'activité",
    categorie: "Social",
    description_courte: "Complément de revenu pour les travailleurs aux revenus modestes.",
    pour_qui: "Salariés, travailleurs indépendants, étudiants salariés ou apprentis de plus de 18 ans ayant des revenus modestes.",
    etapes: [
      {
        numero: 1,
        titre: "Simulation en ligne",
        description: "Faites une simulation sur caf.fr pour savoir si vous êtes éligible et estimer le montant."
      },
      {
        numero: 2,
        titre: "Faire la demande",
        description: "Remplissez le formulaire de demande en ligne sur votre compte CAF. Indiquez vos revenus des 3 derniers mois."
      },
      {
        numero: 3,
        titre: "Déclarations trimestrielles",
        description: "Tous les 3 mois, déclarez vos ressources sur caf.fr. C'est obligatoire pour continuer à recevoir la prime."
      }
    ],
    documents_necessaires: [
      "RIB",
      "Bulletins de salaire des 3 derniers mois",
      "Avis d'imposition"
    ],
    delai: "Environ 1 mois. Premier versement le mois suivant la demande.",
    cout: "Gratuit",
    ou_faire: "En ligne sur caf.fr",
    lien_officiel: "https://www.caf.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F2882",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["travailleurs", "particuliers"],
    mots_cles: ["prime activité", "caf", "travail", "complément revenu"],
    statut: "publie"
  },
  {
    titre: "Demander l'Aide Personnalisée au Logement (APL)",
    categorie: "Logement",
    description_courte: "Aide pour payer votre loyer ou rembourser votre prêt immobilier.",
    pour_qui: "Locataires ou propriétaires remboursant un prêt, sous conditions de ressources.",
    etapes: [
      {
        numero: 1,
        titre: "Vérifier l'éligibilité du logement",
        description: "Votre logement doit être votre résidence principale et respecter des normes de décence. Votre propriétaire doit avoir signé une convention avec l'État."
      },
      {
        numero: 2,
        titre: "Faire la demande en ligne",
        description: "Connectez-vous sur caf.fr et remplissez le formulaire de demande d'aide au logement."
      },
      {
        numero: 3,
        titre: "Fournir les justificatifs",
        description: "Téléchargez votre bail, une attestation de loyer, votre RIB et vos justificatifs de ressources."
      },
      {
        numero: 4,
        titre: "Mise en paiement",
        description: "L'APL est versée directement à votre propriétaire ou à vous-même selon votre choix."
      }
    ],
    documents_necessaires: [
      "Bail de location",
      "Attestation de loyer fournie par le propriétaire",
      "RIB",
      "Justificatifs de ressources"
    ],
    delai: "Environ 2 mois. L'aide est versée à partir du 1er jour du mois suivant votre emménagement.",
    cout: "Gratuit",
    ou_faire: "En ligne sur caf.fr",
    lien_officiel: "https://www.caf.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F12006",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["locataires", "particuliers"],
    mots_cles: ["apl", "logement", "loyer", "caf", "aide"],
    statut: "publie"
  },

  // ========== SANTÉ / AMELI ==========
  {
    titre: "Créer son compte Ameli",
    categorie: "Santé",
    description_courte: "Accéder à votre espace personnel de l'Assurance Maladie en ligne.",
    pour_qui: "Toute personne affiliée à l'Assurance Maladie (régime général).",
    etapes: [
      {
        numero: 1,
        titre: "Se rendre sur ameli.fr",
        description: "Allez sur le site ameli.fr et cliquez sur 'Créer un compte'."
      },
      {
        numero: 2,
        titre: "Choisir le mode de connexion",
        description: "Vous pouvez utiliser FranceConnect (connexion avec vos identifiants impots.gouv.fr) ou demander un code par courrier."
      },
      {
        numero: 3,
        titre: "Activer le compte",
        description: "Si vous choisissez le code par courrier, vous le recevrez sous 10 jours. Saisissez-le sur ameli.fr pour activer votre compte."
      }
    ],
    documents_necessaires: [
      "Numéro de sécurité sociale",
      "Carte Vitale (optionnel mais utile)"
    ],
    delai: "Immédiat avec FranceConnect, 10 jours par courrier.",
    cout: "Gratuit",
    ou_faire: "En ligne sur ameli.fr",
    lien_officiel: "https://www.ameli.fr/",
    source_url_exact: "https://www.ameli.fr/assure/droits-demarches/principes/compte-ameli",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers"],
    mots_cles: ["ameli", "sécurité sociale", "compte", "santé"],
    statut: "publie"
  },
  {
    titre: "Demander la Complémentaire Santé Solidaire (C2S)",
    categorie: "Santé",
    description_courte: "Mutuelle gratuite ou à moins de 1€ par jour pour les petits revenus.",
    pour_qui: "Personnes ayant de faibles ressources. Remplace la CMU-C et l'ACS.",
    etapes: [
      {
        numero: 1,
        titre: "Vérifier les conditions de ressources",
        description: "Consultez votre avis d'imposition. Vos ressources ne doivent pas dépasser un certain plafond (environ 9000€/an pour une personne seule)."
      },
      {
        numero: 2,
        titre: "Faire la demande",
        description: "Remplissez le formulaire en ligne sur ameli.fr ou téléchargez le formulaire Cerfa et envoyez-le par courrier."
      },
      {
        numero: 3,
        titre: "Fournir les justificatifs",
        description: "Joignez votre avis d'imposition, un justificatif de résidence en France, et votre livret de famille si vous avez des ayants droit."
      },
      {
        numero: 4,
        titre: "Réception de l'attestation",
        description: "Si vous êtes éligible, vous recevrez une attestation de droits. Présentez-la chez le médecin, à la pharmacie, etc."
      }
    ],
    documents_necessaires: [
      "Avis d'imposition ou de non-imposition",
      "Justificatif de résidence stable et régulière en France",
      "Livret de famille (si ayants droit)"
    ],
    delai: "Environ 2 mois",
    cout: "Gratuit (C2S sans participation) ou moins de 1€ par jour (C2S avec participation)",
    ou_faire: "En ligne sur ameli.fr ou par courrier à votre CPAM",
    lien_officiel: "https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante-solidaire",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F10027",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers", "demandeurs"],
    mots_cles: ["c2s", "mutuelle", "santé", "gratuit", "cmu"],
    statut: "publie"
  },

  // ========== EMPLOI / FRANCE TRAVAIL ==========
  {
    titre: "S'inscrire à France Travail (Pôle emploi)",
    categorie: "Travail",
    description_courte: "Inscription obligatoire pour bénéficier de l'accompagnement et des allocations chômage.",
    pour_qui: "Toute personne sans emploi ou en recherche d'emploi, qu'elle ait droit ou non aux allocations chômage.",
    etapes: [
      {
        numero: 1,
        titre: "Pré-inscription en ligne",
        description: "Rendez-vous sur francetravail.fr et cliquez sur 'M'inscrire'. Remplissez le formulaire avec vos informations personnelles et professionnelles."
      },
      {
        numero: 2,
        titre: "Envoyer les justificatifs",
        description: "Téléchargez vos attestations employeur, votre CV, votre RIB et une pièce d'identité."
      },
      {
        numero: 3,
        titre: "Validation de l'inscription",
        description: "Votre inscription sera validée sous quelques jours. Vous recevrez un email de confirmation avec votre identifiant."
      },
      {
        numero: 4,
        titre: "Actualisation mensuelle",
        description: "Chaque mois, vous devrez vous actualiser sur francetravail.fr pour confirmer que vous êtes toujours en recherche d'emploi."
      }
    ],
    documents_necessaires: [
      "Attestations employeur (fournies par vos anciens employeurs)",
      "CV à jour",
      "RIB",
      "Pièce d'identité"
    ],
    delai: "Inscription validée sous 2 à 5 jours.",
    cout: "Gratuit",
    ou_faire: "En ligne sur francetravail.fr",
    lien_officiel: "https://www.francetravail.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F1636",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["demandeurs d'emploi"],
    mots_cles: ["chômage", "emploi", "inscription", "pôle emploi", "france travail"],
    statut: "publie"
  },

  // ========== LOGEMENT ==========
  {
    titre: "Demander un logement social (HLM)",
    categorie: "Logement",
    description_courte: "Obtenir un logement à loyer modéré géré par un organisme HLM.",
    pour_qui: "Toute personne de nationalité française ou étrangère en situation régulière, sous conditions de ressources.",
    etapes: [
      {
        numero: 1,
        titre: "Faire la demande en ligne",
        description: "Rendez-vous sur demande-logement-social.gouv.fr et créez votre dossier. Vous pouvez aussi déposer un dossier papier en mairie ou à la préfecture."
      },
      {
        numero: 2,
        titre: "Obtenir un numéro unique",
        description: "Une fois votre demande enregistrée, vous recevrez un numéro unique d'enregistrement. Conservez-le précieusement."
      },
      {
        numero: 3,
        titre: "Renouveler la demande",
        description: "Votre demande est valable 1 an. Vous devez la renouveler chaque année pour rester sur la liste d'attente."
      },
      {
        numero: 4,
        titre: "Proposition de logement",
        description: "Quand un logement correspondant à vos critères se libère, vous serez contacté pour une visite."
      }
    ],
    documents_necessaires: [
      "Pièce d'identité",
      "Avis d'imposition",
      "Justificatifs de ressources (bulletins de salaire)",
      "Justificatif de domicile actuel"
    ],
    delai: "Très variable : de quelques mois à plusieurs années selon les secteurs.",
    cout: "Gratuit",
    ou_faire: "En ligne sur demande-logement-social.gouv.fr, en mairie ou à la préfecture",
    lien_officiel: "https://www.demande-logement-social.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/F869",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers", "demandeurs"],
    mots_cles: ["hlm", "logement social", "loyer modéré", "demande"],
    statut: "publie"
  },

  // ========== TRANSPORT ==========
  {
    titre: "Demander une carte grise (certificat d'immatriculation)",
    categorie: "Transport",
    description_courte: "Obtenir ou modifier la carte grise de votre véhicule suite à un achat, un déménagement, etc.",
    pour_qui: "Tout propriétaire d'un véhicule (voiture, moto, scooter, etc.).",
    etapes: [
      {
        numero: 1,
        titre: "Rassembler les documents",
        description: "Préparez tous les documents nécessaires : certificat de cession (si achat d'occasion), contrôle technique, pièce d'identité, justificatif de domicile."
      },
      {
        numero: 2,
        titre: "Faire la demande en ligne",
        description: "Rendez-vous sur immatriculation.ants.gouv.fr. Créez un compte et suivez les étapes pour déclarer votre véhicule."
      },
      {
        numero: 3,
        titre: "Payer les taxes",
        description: "Payez en ligne les taxes régionales et la redevance d'acheminement."
      },
      {
        numero: 4,
        titre: "Réception de la carte grise",
        description: "Vous recevrez votre carte grise par courrier sous 7 à 10 jours à votre domicile."
      }
    ],
    documents_necessaires: [
      "Certificat de cession (si achat d'occasion)",
      "Contrôle technique de moins de 6 mois (si véhicule de plus de 4 ans)",
      "Pièce d'identité",
      "Justificatif de domicile de moins de 6 mois",
      "Ancienne carte grise (si changement de titulaire)"
    ],
    delai: "7 à 10 jours par courrier",
    cout: "Variable selon la région et la puissance du véhicule (de 50€ à plusieurs centaines d'euros)",
    ou_faire: "En ligne sur immatriculation.ants.gouv.fr",
    lien_officiel: "https://immatriculation.ants.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/N367",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers"],
    mots_cles: ["carte grise", "immatriculation", "véhicule", "ants"],
    statut: "publie"
  },

  // ========== IMPÔTS ==========
  {
    titre: "Déclarer ses impôts sur le revenu",
    categorie: "Finances",
    description_courte: "Déclaration annuelle obligatoire de vos revenus auprès de l'administration fiscale.",
    pour_qui: "Toute personne majeure domiciliée en France, même sans revenus.",
    etapes: [
      {
        numero: 1,
        titre: "Rassembler les documents",
        description: "Préparez vos bulletins de salaire, attestations Pôle emploi, relevés bancaires, justificatifs de charges déductibles."
      },
      {
        numero: 2,
        titre: "Se connecter à impots.gouv.fr",
        description: "Connectez-vous à votre espace particulier sur impots.gouv.fr avec votre numéro fiscal."
      },
      {
        numero: 3,
        titre: "Remplir la déclaration",
        description: "Vérifiez les informations pré-remplies et complétez avec vos revenus et charges de l'année précédente."
      },
      {
        numero: 4,
        titre: "Valider et signer",
        description: "Vérifiez une dernière fois et validez votre déclaration. Vous recevrez un avis d'imposition en été."
      }
    ],
    documents_necessaires: [
      "Bulletins de salaire de l'année précédente",
      "Attestations de revenus (Pôle emploi, CAF, etc.)",
      "Justificatifs de charges déductibles (dons, emploi à domicile, etc.)"
    ],
    delai: "À faire entre avril et juin chaque année. Date limite variable selon le département.",
    cout: "Gratuit",
    ou_faire: "En ligne sur impots.gouv.fr",
    lien_officiel: "https://www.impots.gouv.fr/",
    source_url_exact: "https://www.service-public.fr/particuliers/vosdroits/N247",
    territory_scope: "FRANCE",
    departements: ["67", "68"],
    audiences: ["particuliers"],
    mots_cles: ["impôts", "déclaration", "revenus", "fiscal"],
    statut: "publie"
  }
];

async function main() {
  console.log('🚀 Starting Démarches ingestion...');
  console.log(`📊 Total démarches to process: ${demarchesData.length}`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Get or create categories
  const categories = new Map();
  for (const demarche of demarchesData) {
    if (demarche.categorie && !categories.has(demarche.categorie)) {
      const slug = slugify(demarche.categorie);
      const category = await prisma.aidCategory.upsert({
        where: { slug },
        update: { label: demarche.categorie },
        create: { slug, label: demarche.categorie }
      });
      categories.set(demarche.categorie, category.id);
    }
  }

  // Process each démarche
  for (const data of demarchesData) {
    try {
      const slug = slugify(data.titre);
      const contentHash = generateContentHash(data);
      const categoryId = data.categorie ? categories.get(data.categorie) : null;

      // Check if exists
      const existing = await prisma.demarche.findUnique({
        where: { slug }
      });

      const demarcheData = {
        titre: data.titre,
        slug,
        categorie: data.categorie || null,
        description_courte: data.description_courte || null,
        pour_qui: data.pour_qui || null,
        etapes: data.etapes || [],
        documents_necessaires: data.documents_necessaires || [],
        delai: data.delai || null,
        cout: data.cout || null,
        ou_faire: data.ou_faire || null,
        lien_officiel: data.lien_officiel || null,
        source_url_exact: data.source_url_exact || null,
        territory_scope: data.territory_scope || 'FRANCE',
        departements: data.departements || [],
        audiences: data.audiences || [],
        mots_cles: data.mots_cles || [],
        content_hash: contentHash,
        categoryId,
        statut: data.statut || 'publie',
        published_at: new Date(),
        date_verification: new Date()
      };

      if (existing) {
        // Update only if content changed
        if (existing.content_hash !== contentHash) {
          await prisma.demarche.update({
            where: { slug },
            data: demarcheData
          });
          updated++;
          console.log(`✏️  Updated: ${data.titre}`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped (no change): ${data.titre}`);
        }
      } else {
        await prisma.demarche.create({
          data: demarcheData
        });
        created++;
        console.log(`✅ Created: ${data.titre}`);
      }
    } catch (error) {
      console.error(`❌ Error processing "${data.titre}":`, error.message);
    }
  }

  console.log('\n📈 Ingestion Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ✏️  Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📊 Total: ${created + updated + skipped}`);
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
