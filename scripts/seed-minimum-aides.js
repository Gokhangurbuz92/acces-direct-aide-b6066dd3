
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const aides = [
    // LOGEMENT (10)
    {
        titre: "Aide Personnalisée au Logement (APL)",
        slug: "apl-aide-personnalisee-logement",
        categorie: "Logement",
        summary_falc: "L'APL est une aide d'argent pour vous aider à payer votre loyer ou votre prêt de maison. Cette aide est donnée tous les mois par la CAF ou la MSA. Elle dépend de combien vous gagnez et du prix de votre loyer. Elle aide les personnes qui n'ont pas beaucoup d'argent pour avoir un logement correct.",
        cest_quoi: "C'est une somme d'argent versée chaque mois pour aider à payer le loyer ou le remboursement d'un prêt immobilier.",
        pour_qui: "Pour les locataires, les colocataires, les sous-locataires (sous conditions) ou les personnes qui achètent leur logement avec un prêt aidé.",
        ce_que_ca_aide: "Cela réduit le montant du loyer que vous devez payer chaque mois à votre propriétaire.",
        documents_necessaires: ["Pièce d'identité", "Relevé d'identité bancaire (RIB)", "Attestation de loyer", "Déclaration de revenus"],
        etapes: [
            { numero: 1, titre: "Préparer vos documents", description: "Rassemblez vos justificatifs de revenus et votre contrat de location." },
            { numero: 2, titre: "Aller sur le site de la CAF", description: "Connectez-vous à votre compte sur caf.fr ou msa.fr." },
            { numero: 3, titre: "Faire la demande en ligne", description: "Remplissez le formulaire de demande d'aide au logement." },
            { numero: 4, titre: "Envoyer les justificatifs", description: "Téléchargez les documents demandés sur le site." }
        ],
        ou_demander: "Sur le site Internet de la CAF ou de la MSA, ou dans un point d'accueil physique.",
        lien_demande: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement/les-aides-au-logement",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F12006" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["logement", "loyer", "argent", "caf"]
    },
    {
        titre: "Aide à l'Installation des Personnels de l'État (AIP)",
        slug: "aip-aide-installation-personnels-etat",
        categorie: "Logement",
        summary_falc: "L'AIP est une aide pour les nouveaux fonctionnaires de l'État. Elle aide à payer les frais quand on emménage dans un nouveau logement. Par exemple, elle aide à payer le premier mois de loyer ou les frais d'agence. C'est une aide pour faciliter le début de carrière.",
        cest_quoi: "Une aide financière pour accompagner l'installation des agents qui débutent dans la fonction publique de l'État.",
        pour_qui: "Les agents de l'État (stagiaires ou titulaires) qui viennent d'être recrutés.",
        ce_que_ca_aide: "Elle aide à payer les dépenses liées à l'entrée dans un nouveau logement (premier loyer, frais d'agence, dépôt de garantie).",
        documents_necessaires: ["Contrat de bail", "Justificatif de nomination", "RIB", "Quittance de loyer"],
        etapes: [
            { numero: 1, titre: "Vérifier votre éligibilité", description: "Regardez si vous remplissez les conditions de ressources et de statut." },
            { numero: 2, titre: "Constituer le dossier", description: "Préparez votre contrat de bail et vos justificatifs de travail." },
            { numero: 3, titre: "Déposer la demande", description: "Faites votre demande sur le site dédié aip-fonctionpublique.fr." }
        ],
        ou_demander: "En ligne sur le site officiel de l'AIP.",
        lien_demande: "https://www.aip-fonctionpublique.fr/",
        sources: [{ nom: "Site de l'AIP", url: "https://www.aip-fonctionpublique.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["fonctionnaire", "demenagement", "logement"]
    },
    {
        titre: "Chèque Énergie",
        slug: "cheque-energie-aide-factures",
        categorie: "Logement",
        summary_falc: "Le chèque énergie est un papier que l'État vous envoie pour payer vos factures d'électricité ou de gaz. Vous ne pouvez pas le transformer en argent liquide. Vous devez le donner à votre fournisseur d'énergie. Il est envoyé automatiquement aux personnes qui ont des petits revenus.",
        cest_quoi: "Un titre de paiement pour régler les factures d'énergie du logement ou certains travaux de rénovation énergétique.",
        pour_qui: "Les ménages ayant des revenus modestes. Il est attribué selon les revenus déclarés aux impôts.",
        ce_que_ca_aide: "Il aide à payer l'électricité, le gaz, le bois, le fioul ou les travaux pour isoler la maison.",
        documents_necessaires: ["Le chèque reçu par courrier", "Votre numéro de client chez le fournisseur d'énergie"],
        etapes: [
            { numero: 1, titre: "Recevoir le chèque", description: "Le chèque arrive chez vous par la poste une fois par an." },
            { numero: 2, titre: "Choisir le fournisseur", description: "Prenez votre facture d'électricité ou de gaz." },
            { numero: 3, titre: "Utiliser le chèque", description: "Envoyez le chèque par courrier ou utilisez-le sur le site internet du chèque énergie." }
        ],
        ou_demander: "C'est automatique, il n'y a rien à demander si vous avez déclaré vos impôts.",
        lien_demande: "https://chequeenergie.gouv.fr/",
        sources: [{ nom: "Ministère de la Transition Énergétique", url: "https://chequeenergie.gouv.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["electricite", "gaz", "facture", "energie"]
    },
    {
        titre: "Fonds de Solidarité pour le Logement (FSL)",
        slug: "fsl-fonds-solidarite-logement",
        categorie: "Logement",
        summary_falc: "Le FSL est une aide pour les personnes qui ont de grosses difficultés avec leur logement. Elle peut aider à payer le dépôt de garantie quand on entre dans un logement. Elle peut aussi aider à payer des dettes de loyer ou de factures d'eau et d'électricité. C'est le département qui gère cette aide.",
        cest_quoi: "Une aide financière (prêt ou subvention) pour accéder ou rester dans son logement.",
        pour_qui: "Les personnes en situation de précarité qui ne peuvent pas payer leurs charges liées au logement.",
        ce_que_ca_aide: "Elle aide pour le cautionnement, les frais d'agence, le premier loyer ou les factures impayées.",
        documents_necessaires: ["Justificatifs de toutes les ressources du foyer", "Quittances de loyer", "Factures impayées", "Livret de famille"],
        etapes: [
            { numero: 1, titre: "Prendre rendez-vous", description: "Contactez un travailleur social (assistante sociale)." },
            { numero: 2, titre: "Remplir le dossier", description: "Expliquez votre situation et donnez vos justificatifs." },
            { numero: 3, titre: "Attendre la commission", description: "Une équipe décide si l'aide peut vous être accordée." }
        ],
        ou_demander: "Auprès des services sociaux du département (Conseil Départemental) ou de votre mairie (CCAS).",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F3396" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["urgence", "dette", "loyer", "social"]
    },
    {
        titre: "Garantie Visale",
        slug: "garantie-visale-caution-locative",
        categorie: "Logement",
        summary_falc: "La garantie Visale est comme une caution gratuite pour votre futur logement. Si vous ne pouvez plus payer votre loyer, c'est l'organisme Action Logement qui paie à votre place au propriétaire. Cela rassure les propriétaires et vous aide à trouver un logement plus facilement.",
        cest_quoi: "Une caution locative gratuite qui garantit au propriétaire le paiement des loyers impayés.",
        pour_qui: "Les jeunes de moins de 30 ans et les salariés de plus de 30 ans qui gagnent moins de 1500 euros par mois.",
        ce_que_ca_aide: "Cela évite d'avoir besoin d'un garant physique (famille ou amis) pour louer un appartement.",
        documents_necessaires: ["Pièce d'identité", "Justificatif de situation (travail, étudiant)", "Fiches de paie"],
        etapes: [
            { numero: 1, titre: "Demander le visa", description: "Allez sur visale.fr et créez un compte avant de signer le bail." },
            { numero: 2, titre: "Obtenir le certificat", description: "Action Logement vérifie votre dossier et vous donne un certificat." },
            { numero: 3, titre: "Donner le certificat", description: "Donnez ce certificat au propriétaire au moment de la visite." }
        ],
        ou_demander: "En ligne sur le site visale.fr.",
        lien_demande: "https://www.visale.fr/",
        sources: [{ nom: "Action Logement", url: "https://www.visale.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["caution", "garant", "location", "jeune"]
    },
    {
        titre: "Loca-Pass (Avance)",
        slug: "avance-loca-pass",
        categorie: "Logement",
        summary_falc: "L'avance Loca-Pass est un prêt sans intérêt pour payer le dépôt de garantie de votre logement. Le dépôt de garantie est l'argent que vous donnez au propriétaire en entrant. Vous remboursez ce prêt petit à petit, par exemple 20 euros par mois. C'est Action Logement qui prête cet argent.",
        cest_quoi: "Un prêt à 0% pour financer le dépôt de garantie demandé par le propriétaire à l'entrée dans les lieux.",
        pour_qui: "Les jeunes de moins de 30 ans et les salariés du secteur privé.",
        ce_que_ca_aide: "Cela permet d'entrer dans un logement même si on n'a pas d'épargne pour payer la caution.",
        documents_necessaires: ["Contrat de location", "RIB", "Justificatif d'emploi ou de statut étudiant"],
        etapes: [
            { numero: 1, titre: "Vérifier le délai", description: "La demande doit être faite au plus tard 2 mois après l'entrée dans le logement." },
            { numero: 2, titre: "Faire la demande", description: "Remplissez le formulaire sur le site d'Action Logement." },
            { numero: 3, titre: "Rembourser", description: "Déterminez le montant que vous pouvez rendre chaque mois." }
        ],
        ou_demander: "Sur le site actionlogement.fr.",
        lien_demande: "https://www.actionlogement.fr/l-avance-loca-pass",
        sources: [{ nom: "Action Logement", url: "https://www.actionlogement.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["pret", "caution", "loyer", "entree"]
    },
    {
        titre: "Allocation de Logement Social (ALS)",
        slug: "als-allocation-logement-social",
        categorie: "Logement",
        summary_falc: "L'ALS est une aide pour les personnes qui ne peuvent pas avoir l'APL. Elle aide aussi à payer le loyer. Elle est souvent donnée aux étudiants, aux jeunes travailleurs ou aux personnes âgées. C'est la CAF ou la MSA qui la verse chaque mois selon vos revenus.",
        cest_quoi: "Une aide financière destinée à réduire le montant de votre loyer.",
        pour_qui: "Ceux qui ne remplissent pas les conditions de l'APL ou de l'ALF (Allocation de Logement Familial).",
        ce_que_ca_aide: "Elle rend le logement plus abordable en payant une partie du loyer.",
        documents_necessaires: ["Attestation de loyer", "RIB", "Déclaration de ressources"],
        etapes: [
            { numero: 1, titre: "Vérifier ses droits", description: "Utilisez le simulateur de la CAF." },
            { numero: 2, titre: "Remplir la demande", description: "Connectez-vous à votre espace personnel caf.fr." }
        ],
        ou_demander: "CAF ou MSA.",
        sources: [{ nom: "CAF", url: "https://www.caf.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["loyer", "aide", "etudiant", "senior"]
    },
    {
        titre: "Aide Mobili-Jeune",
        slug: "aide-mobili-jeune",
        categorie: "Logement",
        summary_falc: "Mobili-Jeune est une aide pour les jeunes qui font une alternance (apprentissage ou contrat pro). Elle aide à payer une partie du loyer, entre 10 et 100 euros par mois. C'est une aide pour aider les jeunes à se loger près de leur entreprise ou de leur école.",
        cest_quoi: "Une subvention pour prendre en charge une partie du loyer pendant la durée d'une formation en alternance.",
        pour_qui: "Les jeunes de moins de 30 ans en contrat d'apprentissage ou de professionnalisation dans une entreprise du secteur privé.",
        ce_que_ca_aide: "Elle réduit le poids du loyer dans le budget du jeune alternant.",
        documents_necessaires: ["Contrat d'alternance", "Bail", "Fiche de paie", "RIB"],
        etapes: [
            { numero: 1, titre: "S'inscrire", description: "Créez votre compte sur le site Action Logement dédié aux jeunes." },
            { numero: 2, titre: "Envoyer les quittances", description: "Chaque mois ou trimestre, envoyez votre preuve de paiement de loyer." }
        ],
        ou_demander: "En ligne sur mobili-jeune.actionlogement.fr.",
        lien_demande: "https://mobilijeune.actionlogement.fr/",
        sources: [{ nom: "Action Logement", url: "https://www.actionlogement.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["alternance", "apprentissage", "loyer", "jeune"]
    },
    {
        titre: "Logement Social (HLM)",
        slug: "demande-logement-social-hlm",
        categorie: "Logement",
        summary_falc: "Un logement social est un appartement avec un loyer moins cher que dans le privé. Pour en avoir un, il faut faire une demande officielle. On reçoit un numéro unique. Ensuite, on attend qu'un appartement se libère. Le temps d'attente peut être long, parfois plusieurs années.",
        cest_quoi: "Un logement géré par des organismes publics ou sociaux avec des loyers plafonnés.",
        pour_qui: "Toute personne résidant en France de manière régulière et ayant des revenus inférieurs à certains plafonds.",
        ce_que_ca_aide: "Cela permet d'avoir un logement de bonne qualité pour un prix raisonnable.",
        documents_necessaires: ["Pièce d'identité ou titre de séjour", "Avis d'imposition"],
        etapes: [
            { numero: 1, titre: "Demande en ligne", description: "Allez sur demande-logement-social.gouv.fr." },
            { numero: 2, titre: "Valider le dossier", description: "Joignez votre pièce d'identité pour recevoir votre Numéro Unique." },
            { numero: 3, titre: "Renouveler", description: "N'oubliez pas de renouveler votre demande chaque année." }
        ],
        ou_demander: "En ligne ou auprès d'un guichet enregistreur (mairie, bailleur social).",
        lien_demande: "https://www.demande-logement-social.gouv.fr/",
        sources: [{ nom: "Ministère du Logement", url: "https://www.demande-logement-social.gouv.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["appartement", "loyer", "hlm", "maison"]
    },
    {
        titre: "Aide au Chauffage (Chèque Fioul/Bois)",
        slug: "aide-chauffage-fioul-bois",
        categorie: "Logement",
        summary_falc: "C'est une aide exceptionnelle pour les personnes qui chauffent leur maison avec du bois ou du fioul. C'est un chèque d'argent pour aider quand les prix augmentent. On le reçoit selon ses revenus. Il faut parfois le demander sur internet car ce n'est pas toujours automatique.",
        cest_quoi: "Un chèque exceptionnel pour aider à payer les factures de fioul ou de bois de chauffage.",
        pour_qui: "Les foyers modestes utilisant ces énergies.",
        ce_que_ca_aide: "Cela diminue le coût élevé du remplissage de la cuve de fioul ou de l'achat de bois en hiver.",
        documents_necessaires: ["Facture de fioul ou de bois à votre nom"],
        etapes: [
            { numero: 1, titre: "Vérifier le calendrier", description: "Ces aides sont souvent limitées dans le temps." },
            { numero: 2, titre: "Demander en ligne", description: "Utilisez le portail chèque énergie pour faire la demande." }
        ],
        ou_demander: "Sur chequeenergie.gouv.fr.",
        sources: [{ nom: "Gouvernement", url: "https://chequeenergie.gouv.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["hiver", "chauffage", "bois", "fioul"]
    },

    // SANTÉ (8)
    {
        titre: "Complémentaire Santé Solidaire (C2S)",
        slug: "c2s-complementaire-sante-solidaire",
        categorie: "Santé",
        summary_falc: "La C2S est une aide pour payer vos frais de santé. Elle remplace ce qu'on appelait avant la CMU-C. Avec la C2S, vous ne payez pas le médecin, les médicaments ou l'hôpital. Elle est gratuite ou coûte moins de 1 euro par jour. Elle aide les personnes qui n'ont pas beaucoup d'argent.",
        cest_quoi: "Une mutuelle gratuite ou très peu chère pour couvrir la part non remboursée par l'Assurance Maladie.",
        pour_qui: "Les personnes dont les revenus sont modestes.",
        ce_que_ca_aide: "Vous n'avez pas d'argent à avancer chez le médecin (tiers payant total) et vous avez des lunettes ou prothèses dentaires sans reste à payer.",
        documents_necessaires: ["Numéro de sécurité sociale", "Avis d'imposition", "Justificatifs de ressources"],
        etapes: [
            { numero: 1, titre: "Demande sur Ameli", description: "Connectez-vous à votre compte Ameli." },
            { numero: 2, titre: "Choisir l'organisme", description: "Choisissez si c'est la CPAM ou une mutuelle qui gère votre C2S." },
            { numero: 3, titre: "Mettre à jour la carte Vitale", description: "Une fois acceptée, mettez à jour votre carte en pharmacie." }
        ],
        ou_demander: "Sur ameli.fr ou au guichet de votre CPAM.",
        lien_demande: "https://www.ameli.fr/assure/remboursements/c2s",
        sources: [{ nom: "Ameli", url: "https://www.ameli.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["mutuelle", "docteur", "hopital", "dentiste"]
    },
    {
        titre: "Aide Médicale de l'État (AME)",
        slug: "ame-aide-medicale-etat",
        categorie: "Santé",
        summary_falc: "L'AME est une aide pour les personnes étrangères qui sont en France depuis plus de 3 mois mais qui n'ont pas de papiers (titre de séjour). Elle permet de se faire soigner gratuitement chez le médecin ou à l'hôpital. Il faut demander cette aide chaque année.",
        cest_quoi: "Un accès gratuit aux soins pour les personnes étrangères en situation irrégulière.",
        pour_qui: "Les personnes étrangères sans titre de séjour vivant en France depuis plus de 3 mois, avec des ressources faibles.",
        ce_que_ca_aide: "Prise en charge à 100% des soins médicaux et hospitaliers, sans avance de frais.",
        documents_necessaires: ["Justificatif d'identité", "Justificatif de domicile depuis plus de 3 mois", "Photo d'identité"],
        etapes: [
            { numero: 1, titre: "Remplir le formulaire", description: "Téléchargez le formulaire S1106 sur Ameli." },
            { numero: 2, titre: "Déposer le dossier", description: "Il faut souvent le déposer en personne à la CPAM pour la première fois." }
        ],
        ou_demander: "À la Caisse Primaire d'Assurance Maladie (CPAM).",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F3079" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["etranger", "soins", "hopital", "gratuit"]
    },
    {
        titre: "Protection Universelle Maladie (PUMA)",
        slug: "puma-protection-universelle-maladie",
        categorie: "Santé",
        summary_falc: "La PUMA permet à toute personne qui travaille ou qui habite en France de façon stable d'avoir ses soins remboursés. Avant, il fallait parfois changer de dossier quand on perdait son travail. Maintenant, c'est automatique et continu tant qu'on habite en France.",
        cest_quoi: "Le droit pour tous à la prise en charge des frais de santé par l'Assurance Maladie.",
        pour_qui: "Toute personne résidant en France de manière stable et régulière.",
        ce_que_ca_aide: "Garantit un remboursement des soins même en cas de changement de situation (perte d'emploi, séparation).",
        documents_necessaires: ["Pièce d'identité", "Justificatif de domicile", "RIB"],
        etapes: [
            { numero: 1, titre: "Ouverture de droits", description: "Si vous arrivez en France, faites une demande de mutation ou d'ouverture de droits." }
        ],
        ou_demander: "CPAM ou sur Ameli.",
        sources: [{ nom: "Ameli", url: "https://www.ameli.fr/assure/droits-demarches/principes/protection-universelle-maladie" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["securite sociale", "remboursement", "sante"]
    },
    {
        titre: "100% Santé (Optique, Dentaire, Audio)",
        slug: "100-pour-cent-sante",
        categorie: "Santé",
        summary_falc: "Le 100% Santé est un choix de lunettes, de dents (couronnes) et d'appareils pour les oreilles qui sont totalement remboursés. Vous n'avez rien à payer de votre poche. Votre opticien ou dentiste doit obligatoirement vous proposer ces modèles sans frais supplémentaires.",
        cest_quoi: "Un ensemble de soins et d'équipements (lunettes, prothèses dentaires, aides auditives) sans aucun reste à payer.",
        pour_qui: "Toute personne ayant une mutuelle 'responsable' ou la C2S.",
        ce_que_ca_aide: "Permet de bien voir et bien entendre sans dépenser d'argent en plus de sa mutuelle.",
        documents_necessaires: ["Votre carte Vitale", "Votre carte de mutuelle"],
        etapes: [
            { numero: 1, titre: "Demander le devis", description: "Demandez un devis '100% Santé' chez l'opticien, le dentiste ou l'audioprothésiste." },
            { numero: 2, titre: "Comparer", description: "Vérifiez que le prix est bien égal au remboursement." }
        ],
        ou_demander: "Chez les professionnels de santé (opticiens, dentistes, etc.).",
        sources: [{ nom: "Ministère de la Santé", url: "https://sante.gouv.fr/systeme-de-sante-et-assurance-maladie/100-sante/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["lunettes", "dents", "oreilles", "gratuit"]
    },
    {
        titre: "Aide au transport pour soins (Bon de transport)",
        slug: "bon-de-transport-medical",
        categorie: "Santé",
        summary_falc: "Si vous êtes malade et que vous ne pouvez pas aller tout seul au rendez-vous médical, le médecin peut vous donner un bon de transport. C'est l'Assurance Maladie qui paie le taxi ou l'ambulance. Il faut que ce soit le médecin qui décide que c'est nécessaire pour votre santé.",
        cest_quoi: "La prise en charge des frais de transport pour se rendre à un rendez-vous médical ou à l'hôpital.",
        pour_qui: "Les patients dont l'état de santé nécessite un transport spécialisé (ALD, hospitalisation, etc.).",
        ce_que_ca_aide: "Évite de payer le coût parfois élevé d'un trajet en ambulance ou en taxi conventionné.",
        documents_necessaires: ["Prescription médicale de transport (bon de transport) signé par le médecin"],
        etapes: [
            { numero: 1, titre: "Obtenir le bon", description: "Demandez la prescription à votre médecin AVANT le trajet." },
            { numero: 2, titre: "Appeler le transporteur", description: "Contactez un taxi conventionné ou une société d'ambulance." }
        ],
        ou_demander: "À votre médecin traitant.",
        sources: [{ nom: "Ameli", url: "https://www.ameli.fr/assure/remboursements/rembourse/transport" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["taxi", "ambulance", "hopital", "transport"]
    },
    {
        titre: "Bilan de santé gratuit (Examen de Prévention)",
        slug: "bilan-de-sante-gratuit-cpam",
        categorie: "Santé",
        summary_falc: "La CPAM propose un grand examen de santé gratuit tous les 5 ans. On vérifie votre coeur, votre vue, votre audition et on fait une prise de sang. C'est pour voir si vous allez bien et découvrir des maladies avant qu'elles ne soient graves. C'est ouvert à tous les assurés.",
        cest_quoi: "Un examen médical complet et gratuit adapté à votre âge et votre situation.",
        pour_qui: "Tous les assurés sociaux, avec une priorité pour les personnes en situation de précarité.",
        ce_que_ca_aide: "Permet de faire le point sur sa santé et de recevoir des conseils de prévention.",
        documents_necessaires: ["Carte Vitale", "Questionnaire de santé reçu par courrier"],
        etapes: [
            { numero: 1, titre: "S'inscrire", description: "Inscrivez-vous sur le site Ameli ou appelez votre centre de santé CPAM." },
            { numero: 2, titre: "Aller au centre", description: "Prévoyez une matinée pour faire tous les tests." }
        ],
        ou_demander: "Auprès de votre CPAM ou centres d'examens de santé.",
        sources: [{ nom: "Ameli", url: "https://www.ameli.fr/assure/sante/examen-prevention-sante" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["docteur", "preventif", "gratuit", "checkup"]
    },
    {
        titre: "Prise en charge Affection de Longue Durée (ALD)",
        slug: "ald-affection-longue-duree",
        categorie: "Santé",
        summary_falc: "Si vous avez une maladie grave ou qui dure longtemps (comme le diabète), vous pouvez être en ALD. Le médecin fait la demande. Cela permet d'être remboursé à 100% pour tous les soins liés à cette maladie. Vous ne payez rien chez le médecin pour ces soins précis.",
        cest_quoi: "Un dispositif pour les maladies nécessitant un traitement prolongé et coûteux.",
        pour_qui: "Les patients atteints de maladies inscrites sur une liste officielle (30 maladies) ou hors liste sous condition.",
        ce_que_ca_aide: "Suppression du ticket modérateur (100% de remboursement) pour les soins en rapport avec la maladie.",
        documents_necessaires: ["Protocole de soins établi par le médecin"],
        etapes: [
            { numero: 1, titre: "Rendez-vous médecin", description: "Parlez-en à votre médecin traitant." },
            { numero: 2, titre: "Validation médecin-conseil", description: "Le médecin de l'assurance maladie valide le dossier." }
        ],
        ou_demander: "À votre médecin traitant.",
        sources: [{ nom: "Ameli", url: "https://www.ameli.fr/assure/droits-demarches/ald-et-maladies-chroniques" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["maladie", "chronique", "remboursement", "100%"]
    },
    {
        titre: "Aide au sevrage tabagique (Arrêter de fumer)",
        slug: "aide-arret-tabac",
        categorie: "Santé",
        summary_falc: "L'Assurance Maladie rembourse les substituts nicotiniques (patchs, gommes, pastilles) pour vous aider à arrêter de fumer. Il faut une ordonnance d'un médecin, d'un infirmier ou d'un pharmacien. C'est remboursé à 65% par la sécurité sociale et le reste par votre mutuelle.",
        cest_quoi: "Le remboursement des médicaments et patchs pour arrêter le tabac.",
        pour_qui: "Toute personne souhaitant arrêter de fumer.",
        ce_que_ca_aide: "Réduit le prix des traitements qui aident à ne plus avoir envie de fumer.",
        documents_necessaires: ["Ordonnance médicale"],
        etapes: [
            { numero: 1, titre: "Consulter", description: "Allez voir un professionnel de santé pour avoir une ordonnance." },
            { numero: 2, titre: "Acheter en pharmacie", description: "Présentez votre carte Vitale." }
        ],
        ou_demander: "Médecin, infirmier, dentiste, sage-femme ou pharmacien.",
        sources: [{ nom: "Tabac Info Service", url: "https://www.tabac-info-service.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["cigarette", "tabac", "sante", "remboursement"]
    },

    // FAMILLE (6)
    {
        titre: "Allocations Familiales",
        slug: "allocations-familiales-caf",
        categorie: "Famille",
        summary_falc: "Les allocations familiales sont de l'argent versé chaque mois aux parents qui ont au moins 2 enfants de moins de 20 ans. Cette aide sert à aider les familles pour les dépenses des enfants (nourriture, vêtements, école). Elle est versée par la CAF ou la MSA. Le montant dépend de vos revenus et du nombre d'enfants.",
        cest_quoi: "Une aide financière mensuelle pour les familles avec au moins deux enfants à charge.",
        pour_qui: "Les parents ou responsables d'au moins 2 enfants de moins de 20 ans vivant en France.",
        ce_que_ca_aide: "Aide à payer les frais quotidiens liés à l'éducation et l'entretien des enfants.",
        documents_necessaires: ["Livret de famille", "RIB", "Déclaration de ressources"],
        etapes: [
            { numero: 1, titre: "Déclarer les naissances", description: "Informez la CAF dès la naissance de votre deuxième enfant." },
            { numero: 2, titre: "Vérifier vos infos", description: "Vérifiez que votre adresse et vos revenus sont à jour sur caf.fr." }
        ],
        ou_demander: "Automatique si vous êtes déjà allocataire, sinon créez un compte sur caf.fr.",
        sources: [{ nom: "CAF", url: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/vie-personnelle/les-allocations-familiales" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["enfant", "argent", "famille", "caf"]
    },
    {
        titre: "Allocation de Rentrée Scolaire (ARS)",
        slug: "allocation-rentree-scolaire",
        categorie: "Famille",
        summary_falc: "L'ARS est une aide versée une fois par an en août. Elle sert à acheter les fournitures scolaires (cartable, cahiers, stylos) et les vêtements pour la rentrée. Elle est pour les enfants de 6 à 18 ans. Elle dépend de vos revenus.",
        cest_quoi: "Une aide financière annuelle pour aider à financer le coût de la rentrée des classes.",
        pour_qui: "Les familles ayant des enfants scolarisés âgés de 6 à 18 ans.",
        ce_que_ca_aide: "Permet d'équiper les enfants pour l'école sans trop dépenser d'un coup.",
        documents_necessaires: ["Certificat de scolarité pour les plus de 16 ans"],
        etapes: [
            { numero: 1, titre: "Déclarer la scolarité", description: "Pour les 16-18 ans, déclarez en ligne que votre enfant est toujours à l'école." }
        ],
        ou_demander: "CAF ou MSA.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F1878" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["ecole", "rentree", "enfant", "cartable"]
    },
    {
        titre: "Prime à la Naissance",
        slug: "prime-naissance-paje",
        categorie: "Famille",
        summary_falc: "La prime à la naissance est une grosse somme d'argent (environ 1000 euros) versée une seule fois au 7ème mois de grossesse. Elle sert à acheter le matériel pour le bébé qui va arriver : la poussette, le lit, les vêtements. Il faut avoir des revenus qui ne dépassent pas un certain plafond.",
        cest_quoi: "Une aide pour faire face aux premières dépenses liées à l'arrivée d'un enfant.",
        pour_qui: "Les futurs parents, sous conditions de ressources.",
        ce_que_ca_aide: "Aide à l'équipement du foyer pour accueillir le nouveau-né.",
        documents_necessaires: ["Déclaration de grossesse faite par le médecin"],
        etapes: [
            { numero: 1, titre: "Déclarer la grossesse", description: "Faites-le avant la 14ème semaine de grossesse auprès de la CAF et de l'assurance maladie." }
        ],
        ou_demander: "CAF ou MSA.",
        sources: [{ nom: "CAF", url: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/vie-personnelle/prime-a-la-naissance" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["bebe", "grossesse", "argent", "naissance"]
    },
    {
        titre: "Allocation de Soutien Familial (ASF)",
        slug: "asf-allocation-soutien-familial",
        categorie: "Famille",
        summary_falc: "L'ASF est une aide pour les parents qui élèvent seuls un enfant (familles monoparentales). Elle est versée si l'autre parent ne paie pas de pension alimentaire ou s'il est décédé. Elle permet d'aider à l'éducation de l'enfant quand il n'y a qu'un seul revenu au foyer.",
        cest_quoi: "Une aide pour les parents isolés ou pour compenser l'absence de pension alimentaire.",
        pour_qui: "Les parents vivant seuls avec un enfant à charge.",
        ce_que_ca_aide: "Garantit un revenu minimum pour l'entretien de l'enfant.",
        documents_necessaires: ["Justificatif de séparation ou de décès", "Jugement de tribunal si existant"],
        etapes: [
            { numero: 1, titre: "Demande en ligne", description: "Déclarez votre situation de parent isolé sur caf.fr." }
        ],
        ou_demander: "CAF ou MSA.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F815" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["seul", "separation", "enfant", "parent"]
    },
    {
        titre: "Complément de Libre Choix du Mode de Garde (CMG)",
        slug: "cmg-garde-enfant",
        categorie: "Famille",
        summary_falc: "Le CMG est une aide pour payer la personne qui garde votre enfant (nounou, assistante maternelle ou crèche). La CAF paie une partie du salaire de cette personne. Cela permet aux parents de travailler pendant que l'enfant est gardé en sécurité.",
        cest_quoi: "Une prise en charge d'une partie des frais de garde d'un enfant de moins de 6 ans.",
        pour_qui: "Les parents qui travaillent et font garder leur enfant par une assistante maternelle ou une garde à domicile.",
        ce_que_ca_aide: "Réduit le coût mensuel de la garde d'enfant.",
        documents_necessaires: ["Contrat de travail de la nounou", "RIB", "Déclaration Pajemploi"],
        etapes: [
            { numero: 1, titre: "Choisir le mode de garde", description: "Trouvez une assistante maternelle agréée." },
            { numero: 2, titre: "S'inscrire à Pajemploi", description: "C'est l'organisme qui gère les salaires des gardes d'enfants." }
        ],
        ou_demander: "CAF et Pajemploi.",
        sources: [{ nom: "Pajemploi", url: "https://www.pajemploi.urssaf.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["nounou", "creche", "travail", "enfant"]
    },
    {
        titre: "Aide à la Cantine (Bourses)",
        slug: "aide-cantine-scolaire",
        categorie: "Famille",
        summary_falc: "C'est une aide pour payer moins cher le repas de midi à l'école. Selon vos revenus, la mairie ou le département peut payer une partie du prix. Parfois, le repas ne coûte que 1 euro pour les familles qui ont peu d'argent. Il faut demander à l'école ou à la mairie.",
        cest_quoi: "Une réduction du tarif de la restauration scolaire.",
        pour_qui: "Les enfants scolarisés dont les parents ont de faibles revenus.",
        ce_que_ca_aide: "Permet à l'enfant de manger un repas équilibré à l'école pour un petit prix.",
        documents_necessaires: ["Attestation CAF", "Avis d'imposition"],
        etapes: [
            { numero: 1, titre: "Contacter la mairie", description: "Demandez le dossier de tarification solidaire." }
        ],
        ou_demander: "Mairie (service scolaire) ou collège/lycée.",
        sources: [{ nom: "Gouvernement", url: "https://www.service-public.fr/particuliers/vosdroits/F2457" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["ecole", "repas", "cantine", "manger"]
    },

    // HANDICAP (6)
    {
        titre: "Allocation aux Adultes Handicapés (AAH)",
        slug: "aah-allocation-adultes-handicapes",
        categorie: "Handicap",
        summary_falc: "L'AAH est un revenu pour les personnes qui ont un handicap et qui ne peuvent pas travailler normalement. Cette aide sert à payer les dépenses de la vie de tous les jours. Depuis 2023, on ne regarde plus les revenus de votre mari ou femme (déconjugalisation). C'est la MDPH qui décide si vous avez droit à l'AAH.",
        cest_quoi: "Un revenu minimum pour assurer une autonomie financière aux personnes handicapées.",
        pour_qui: "Les personnes de plus de 20 ans ayant un taux d'incapacité d'au moins 80% (ou entre 50% et 79% avec une restriction d'accès à l'emploi).",
        ce_que_ca_aide: "Assure un budget mensuel pour vivre dignement malgré le handicap.",
        documents_necessaires: ["Certificat médical", "Pièce d'identité", "Justificatif de domicile"],
        etapes: [
            { numero: 1, titre: "Dossier MDPH", description: "Remplissez le formulaire de la Maison Départementale des Personnes Handicapées." },
            { numero: 2, titre: "Évaluation", description: "Une équipe médicale étudie votre situation." },
            { numero: 3, titre: "Paiement CAF", description: "Une fois accepté par la MDPH, la CAF vous verse l'argent." }
        ],
        ou_demander: "À la MDPH de votre département.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F12242" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["handicap", "argent", "mdph", "autonomie"]
    },
    {
        titre: "Prestation de Compensation du Handicap (PCH)",
        slug: "pch-prestation-compensation-handicap",
        categorie: "Handicap",
        summary_falc: "La PCH est une aide pour payer les besoins précis liés au handicap. Par exemple : payer une personne pour vous aider à vous habiller, acheter un fauteuil roulant, ou faire des travaux pour adapter votre salle de bain. Ce n'est pas un revenu fixe comme l'AAH, c'est pour rembourser des frais.",
        cest_quoi: "Une aide pour financer les besoins liés à la perte d'autonomie (aide humaine, technique, aménagement du logement).",
        pour_qui: "Les personnes handicapées de moins de 60 ans (ou plus si le handicap était présent avant).",
        ce_que_ca_aide: "Finance les dépenses concrètes pour mieux vivre avec le handicap.",
        documents_necessaires: ["Projet de vie (vos besoins)", "Devis pour le matériel ou les travaux"],
        etapes: [
            { numero: 1, titre: "Expliquer ses besoins", description: "Écrivez tout ce qui est difficile pour vous dans le 'projet de vie'." }
        ],
        ou_demander: "À la MDPH.",
        sources: [{ nom: "CNSA", url: "https://www.cnsa.fr/vous-etes-une-personne-handicapee-ou-un-proche/la-prestation-de-compensation-du-handicap-pch" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["aide humaine", "fauteuil", "travaux", "mdph"]
    },
    {
        titre: "Reconnaissance de la Qualité de Travailleur Handicapé (RQTH)",
        slug: "rqth-reconnaissance-travailleur-handicape",
        categorie: "Handicap",
        summary_falc: "La RQTH est un papier officiel qui dit que votre handicap a un impact sur votre travail. Cela permet d'avoir des aménagements (par exemple un siège spécial ou des horaires adaptés). Cela aide aussi à trouver un travail car les entreprises doivent embaucher des personnes handicapées.",
        cest_quoi: "Un statut qui permet de bénéficier d'aides spécifiques pour l'emploi et la formation.",
        pour_qui: "Toute personne dont les possibilités d'obtenir ou de conserver un emploi sont diminuées par un handicap.",
        ce_que_ca_aide: "Facilite l'insertion professionnelle et l'adaptation du poste de travail.",
        documents_necessaires: ["Certificat médical rempli par votre médecin"],
        etapes: [
            { numero: 1, titre: "Demande MDPH", description: "Cochez la case 'RQTH' dans le formulaire MDPH." }
        ],
        ou_demander: "À la MDPH.",
        sources: [{ nom: "Agefiph", url: "https://www.agefiph.fr/articles/conseil-pratique/la-rqth-quoi-ca-sert" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["travail", "emploi", "amenagement", "mdph"]
    },
    {
        titre: "Allocation d'Éducation de l'Enfant Handicapé (AEEH)",
        slug: "aeeh-education-enfant-handicape",
        categorie: "Handicap",
        summary_falc: "L'AEEH est une aide pour les parents qui ont un enfant handicapé de moins de 20 ans. Elle sert à payer les soins qui ne sont pas remboursés et les frais liés au handicap de l'enfant. Si le parent doit arrêter de travailler pour s'occuper de son enfant, il peut avoir un complément d'argent.",
        cest_quoi: "Une aide pour compenser les frais d'éducation et de soins d'un enfant handicapé.",
        pour_qui: "Les parents d'un enfant handicapé.",
        ce_que_ca_aide: "Aide à payer les rééducations, le matériel ou compense la perte de salaire du parent.",
        documents_necessaires: ["Dossier MDPH", "Certificat médical de l'enfant"],
        etapes: [
            { numero: 1, titre: "Dossier MDPH", description: "Faites la demande pour votre enfant." }
        ],
        ou_demander: "À la MDPH (évaluation) puis versé par la CAF.",
        sources: [{ nom: "CAF", url: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/handicap/allocation-d-education-de-l-enfant-handicape-aeeh" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["enfant", "scolarite", "soins", "parent"]
    },
    {
        titre: "Carte Mobilité Inclusion (CMI)",
        slug: "cmi-carte-mobilite-inclusion",
        categorie: "Handicap",
        summary_falc: "La CMI est une carte qui remplace les anciennes cartes de priorité et de stationnement. Il y a 3 types : Stationnement (pour se garer sur les places handicapées), Priorité (pour ne pas attendre dans les fils) et Invalidité. Cela rend la vie quotidienne plus facile dans les déplacements.",
        cest_quoi: "Une carte facilitant les déplacements des personnes handicapées ou en perte d'autonomie.",
        pour_qui: "Personnes handicapées ou personnes âgées dépendantes.",
        ce_que_ca_aide: "Donne accès aux places de parking réservées ou aux fils d'attente prioritaires.",
        documents_necessaires: ["Photo d'identité", "Certificat médical"],
        etapes: [
            { numero: 1, titre: "Cocher la demande", description: "Demandez la carte dans votre formulaire MDPH." }
        ],
        ou_demander: "À la MDPH.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F34049" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["parking", "priorite", "transport", "carte"]
    },
    {
        titre: "Aide à l'Aménagement du Logement (Handicap)",
        slug: "aide-amenagement-logement-handicap",
        categorie: "Handicap",
        summary_falc: "Si vous êtes en situation de handicap, vous pouvez avoir des aides pour transformer votre maison. Par exemple : remplacer la baignoire par une douche plate, installer une rampe pour le fauteuil. C'est important pour continuer à vivre chez soi en sécurité. L'Anah et la MDPH peuvent aider financièrement.",
        cest_quoi: "Des subventions pour réaliser des travaux d'accessibilité dans son habitation.",
        pour_qui: "Propriétaires ou locataires handicapés.",
        ce_que_ca_aide: "Prend en charge une partie du coût élevé des travaux d'adaptation.",
        documents_necessaires: ["Devis d'entreprises", "Diagnostic d'ergothérapeute"],
        etapes: [
            { numero: 1, titre: "Faire un diagnostic", description: "Demandez à un ergothérapeute de venir chez vous pour voir ce qu'il faut changer." },
            { numero: 2, titre: "Demander des devis", description: "Contactez des artisans pour avoir des prix." }
        ],
        ou_demander: "Anah (France Rénov) ou MDPH (via la PCH).",
        sources: [{ nom: "Anah", url: "https://www.anah.gouv.fr/proprietaires/nos-aides/adapter-son-logement-au-vieillissement-ou-au-handicap" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["maison", "travaux", "douche", "securite"]
    },

    // EMPLOI (6)
    {
        titre: "Revenu de Solidarité Active (RSA)",
        slug: "rsa-revenu-solidarite-active",
        categorie: "Emploi",
        summary_falc: "Le RSA est une aide d'argent pour les personnes qui n'ont pas de revenus ou qui gagnent très peu. Il sert à avoir un minimum d'argent pour vivre et manger. En échange, vous devez chercher un travail ou faire des démarches pour vous insérer. Il est versé par la CAF.",
        cest_quoi: "Un revenu minimum pour les personnes sans ressources.",
        pour_qui: "Les personnes de plus de 25 ans (ou moins avec enfants) résidant en France.",
        ce_que_ca_aide: "Assure des ressources de base pour le quotidien.",
        documents_necessaires: ["RIB", "Déclaration de ressources des 3 derniers mois"],
        etapes: [
            { numero: 1, titre: "Simulateur", description: "Faites une simulation sur caf.fr." },
            { numero: 2, titre: "Dépôt de demande", description: "Faites la demande en ligne sur votre compte CAF." }
        ],
        ou_demander: "CAF ou MSA.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F1977" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["argent", "chomage", "insertion", "caf"]
    },
    {
        titre: "Prime d'Activité",
        slug: "prime-d-activite-caf",
        categorie: "Emploi",
        summary_falc: "La prime d'activité est une aide pour les personnes qui travaillent mais qui ont des petits salaires. Elle sert à augmenter votre pouvoir d'achat. Il faut déclarer ce que vous gagnez tous les 3 mois à la CAF. Le montant change selon ce que vous avez gagné.",
        cest_quoi: "Un complément de revenu pour les travailleurs modestes.",
        pour_qui: "Salariés ou indépendants de plus de 18 ans avec des revenus inférieurs à un certain plafond.",
        ce_que_ca_aide: "Complète le salaire pour encourager l'activité professionnelle.",
        documents_necessaires: ["Fiches de paie", "Montant net social"],
        etapes: [
            { numero: 1, titre: "Déclaration trimestrielle", description: "Tous les 3 mois, dites à la CAF combien vous avez gagné." }
        ],
        ou_demander: "CAF ou MSA.",
        sources: [{ nom: "CAF", url: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/vie-professionnelle/la-prime-d-activite" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["salaire", "travail", "argent", "smic"]
    },
    {
        titre: "Allocation chômage (ARE)",
        slug: "are-allocation-retour-emploi",
        categorie: "Emploi",
        summary_falc: "L'ARE est l'argent que vous recevez du chômage quand vous perdez votre travail (si vous n'avez pas démissionné). Pour y avoir droit, il faut avoir travaillé un certain nombre de mois. Vous devez être inscrit à France Travail (anciennement Pôle Emploi) et chercher un nouveau travail.",
        cest_quoi: "Un revenu de remplacement versé aux personnes involontairement privées d'emploi.",
        pour_qui: "Les anciens salariés ayant travaillé suffisamment longtemps.",
        ce_que_ca_aide: "Remplace une partie de l'ancien salaire le temps de retrouver un emploi.",
        documents_necessaires: ["Attestation employeur", "Pièce d'identité", "RIB"],
        etapes: [
            { numero: 1, titre: "S'inscrire", description: "Inscrivez-vous sur francetravail.fr dès le lendemain de votre fin de contrat." },
            { numero: 2, titre: "S'actualiser", description: "Chaque mois, validez que vous cherchez toujours un travail sur le site." }
        ],
        ou_demander: "France Travail.",
        sources: [{ nom: "France Travail", url: "https://www.francetravail.fr/candidat/mes-droits-aux-allocations/l-allocation-d-aide-au-retour-a.html" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["chomage", "travail", "licenciement", "argent"]
    },
    {
        titre: "Contrat d'Engagement Jeune (CEJ)",
        slug: "cej-contrat-engagement-jeune",
        categorie: "Emploi",
        summary_falc: "Le CEJ est un programme pour les jeunes de moins de 26 ans qui ne travaillent pas et ne font pas d'études. On vous aide à trouver un projet, une formation ou un travail. Si vous respectez les rendez-vous et les ateliers, vous recevez une allocation d'argent tous les mois pour vous aider.",
        cest_quoi: "Un accompagnement intensif pour les jeunes avec une aide financière mensuelle.",
        pour_qui: "Jeunes de 16 à 25 ans (jusqu'à 29 ans pour les handicapés) sans emploi ni formation stable.",
        ce_que_ca_aide: "Donne un cadre de recherche et des ressources financières pour devenir autonome.",
        documents_necessaires: ["Pièce d'identité", "RIB"],
        etapes: [
            { numero: 1, titre: "Prendre rendez-vous", description: "Allez à la Mission Locale ou à France Travail." }
        ],
        ou_demander: "Mission Locale ou France Travail.",
        sources: [{ nom: "Gouvernement", url: "https://www.1jeune1solution.gouv.fr/contrat-engagement-jeune" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["jeune", "emploi", "argent", "accompagnement"]
    },
    {
        titre: "Compte Personnel de Formation (CPF)",
        slug: "cpf-mon-compte-formation",
        categorie: "Emploi",
        summary_falc: "Le CPF est une cagnotte d'argent pour payer des formations quand vous travaillez. Chaque année, l'État met 500 euros sur votre compte si vous travaillez à temps plein. Vous pouvez utiliser cet argent pour apprendre un nouveau métier, passer le permis de conduire ou apprendre une langue.",
        cest_quoi: "Un compte qui cumule des droits à la formation utilisables tout au long de la vie pro.",
        pour_qui: "Toute personne de plus de 16 ans qui travaille ou a travaillé.",
        ce_que_ca_aide: "Permet de payer des formations sans utiliser son propre salaire.",
        documents_necessaires: ["Numéro de sécurité sociale"],
        etapes: [
            { numero: 1, titre: "Créer son compte", description: "Allez sur moncompteformation.gouv.fr avec FranceConnect." },
            { numero: 2, titre: "Choisir sa formation", description: "Recherchez une formation certifiée par l'État." }
        ],
        ou_demander: "Sur le site officiel moncompteformation.gouv.fr.",
        lien_demande: "https://www.moncompteformation.gouv.fr/",
        sources: [{ nom: "Ministère du Travail", url: "https://www.moncompteformation.gouv.fr/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["formation", "permis", "travail", "apprendre"]
    },
    {
        titre: "Aide au Permis de Conduire (France Travail)",
        slug: "aide-permis-france-travail",
        categorie: "Emploi",
        summary_falc: "Si vous ne pouvez pas chercher un travail car vous n'avez pas le permis, France Travail peut vous aider. Ils peuvent payer jusqu'à 1200 euros à votre auto-école. Il faut être inscrit depuis au moins 6 mois et prouver que vous avez besoin du permis pour votre futur travail.",
        cest_quoi: "Une aide financière pour payer les leçons de conduite et l'examen du permis B.",
        pour_qui: "Demandeurs d'emploi inscrits depuis au moins 6 mois.",
        ce_que_ca_aide: "Lève le frein de la mobilité pour accéder à plus d'offres d'emploi.",
        documents_necessaires: ["Devis de l'auto-école", "Justification du besoin de permis"],
        etapes: [
            { numero: 1, titre: "Parler au conseiller", description: "Expliquez votre projet à votre conseiller France Travail." }
        ],
        ou_demander: "À votre conseiller France Travail.",
        sources: [{ nom: "France Travail", url: "https://www.francetravail.fr/candidat/mes-aides-financieres/aide-au-permis-de-conduire.html" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["voiture", "permis", "emploi", "mobilite"]
    },

    // BUDGET / DETTES (5)
    {
        titre: "Dossier de Surendettement",
        slug: "dossier-surendettement-banque-france",
        categorie: "Budget/Dettes",
        summary_falc: "Si vous avez trop de dettes et que vous ne pouvez plus les payer, vous pouvez faire un dossier de surendettement. La Banque de France regarde votre dossier. Elle peut demander aux banques de baisser vos mensualités ou même d'effacer certaines dettes. C'est une protection pour recommencer sur de bonnes bases.",
        cest_quoi: "Une procédure gratuite pour trouver une solution aux difficultés financières graves.",
        pour_qui: "Les particuliers qui n'arrivent plus à payer leurs dettes personnelles.",
        ce_que_ca_aide: "Stoppe les saisies et permet de réorganiser le remboursement des dettes selon ce que vous pouvez vraiment payer.",
        documents_necessaires: ["Justificatifs de toutes les dettes", "Avis d'imposition", "Relevés de compte"],
        etapes: [
            { numero: 1, titre: "Prendre conseil", description: "Allez voir une association spécialisée ou une assistante sociale." },
            { numero: 2, titre: "Remplir le dossier", description: "Remplissez le formulaire de la Banque de France très précisément." }
        ],
        ou_demander: "À la Banque de France de votre territoire.",
        sources: [{ nom: "Banque de France", url: "https://particuliers.banque-france.fr/surendettement" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["dette", "banque", "argent", "difficultes"]
    },
    {
        titre: "Microcrédit Personnel",
        slug: "microcredit-personnel-social",
        categorie: "Budget/Dettes",
        summary_falc: "Le microcrédit est un petit prêt d'argent pour les personnes qui ne peuvent pas faire de prêt à la banque. C'est pour un projet important : acheter une voiture d'occasion pour aller travailler ou remplacer un frigo cassé. On vous aide à le rembourser petit à petit. Il n'est pas fait pour payer d'autres dettes.",
        cest_quoi: "Un prêt d'un petit montant avec un accompagnement social.",
        pour_qui: "Les personnes exclues du système bancaire classique mais ayant une capacité de remboursement.",
        ce_que_ca_aide: "Permet de réaliser un achat indispensable pour l'insertion pro ou sociale.",
        documents_necessaires: ["Budget mensuel", "Projet précis"],
        etapes: [
            { numero: 1, titre: "Contacter un réseau", description: "Allez au CCAS de votre ville ou à la Croix-Rouge." }
        ],
        ou_demander: "CCAS, Croix-Rouge, Secours Catholique ou UDAF.",
        sources: [{ nom: "Banque de France", url: "https://particuliers.banque-france.fr/credit/microcredit" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["pret", "argent", "achat", "banque"]
    },
    {
        titre: "Aide exceptionnelle des services sociaux",
        slug: "aide-financiere-exceptionnelle",
        categorie: "Budget/Dettes",
        summary_falc: "Parfois, un accident de la vie arrive : une facture d'eau énorme, un appareil indispensable qui casse. Dans ces cas urgents, les services sociaux peuvent donner une petite somme d'argent une seule fois pour vous dépanner. C'est une aide pour ne pas tomber dans une situation très grave.",
        cest_quoi: "Un déblocage de fonds ponctuel pour une situation de détresse financière immédiate.",
        pour_qui: "Toute personne vivant une situation d'urgence sociale.",
        ce_que_ca_aide: "Payer une facture de nourriture, une charge de logement urgente ou un besoin vital.",
        documents_necessaires: ["Justificatif de l'urgence", "Dernier relevé de compte"],
        etapes: [
            { numero: 1, titre: "Voir une assistante sociale", description: "C'est elle qui doit monter le dossier avec vous." }
        ],
        ou_demander: "CCAS de votre mairie ou Unité Territoriale d'Action Sociale (UTAS).",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F3396" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["urgence", "argent", "depannage", "social"]
    },
    {
        titre: "Micro-assurance (Assurance auto/habitation)",
        slug: "micro-assurance-sociale",
        categorie: "Budget/Dettes",
        summary_falc: "La micro-assurance est une assurance pour votre voiture ou votre maison qui n'est pas chère. Elle est faite pour les personnes qui ont peu d'argent. Elle couvre le minimum obligatoire pour que vous soyez en règle et protégé sans payer trop cher tous les mois.",
        cest_quoi: "Une protection d'assurance adaptée aux budgets très serrés.",
        pour_qui: "Personnes à bas revenus ou bénéficiaires du RSA.",
        ce_que_ca_aide: "Permet d'être assuré légalement pour un coût réduit.",
        documents_necessaires: ["Carte grise (auto)", "Revenus"],
        etapes: [
            { numero: 1, titre: "Consulter l'ADIE", description: "Cet organisme propose souvent ces solutions." }
        ],
        ou_demander: "ADIE ou associations d'insertion.",
        sources: [{ nom: "ADIE", url: "https://www.adie.org/micro-assurance/" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["assurance", "voiture", "maison", "budget"]
    },
    {
        titre: "Tarif social Eau / Déchets",
        slug: "tarif-social-eau",
        categorie: "Budget/Dettes",
        summary_falc: "Certaines villes proposent un tarif social pour l'eau. Si vous avez peu d'argent, vous payez moins cher le mètre cube d'eau. Dans certaines villes, on ne paie pas non plus la taxe pour les ordures. C'est pour garantir que tout le monde peut avoir de l'eau pour se laver et boire.",
        cest_quoi: "Une réduction sur les factures de services publics locaux.",
        pour_qui: "Les foyers avec des revenus modestes, souvent ceux qui ont la C2S.",
        ce_que_ca_aide: "Diminue les dépenses fixes liées à la vie dans le logement.",
        documents_necessaires: ["Facture d'eau", "Attestation de ressources"],
        etapes: [
            { numero: 1, titre: "Demander à la mairie", description: "Vérifiez si votre ville a mis en place ce dispositif." }
        ],
        ou_demander: "Mairie ou fournisseur d'eau de votre ville.",
        sources: [{ nom: "Gouvernement", url: "https://www.ecologie.gouv.fr/politiques-publiques/tarification-sociale-leau" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["eau", "facture", "mairie", "prix"]
    },

    // RETRAITE / SENIORS (4)
    {
        titre: "Allocation de Solidarité aux Personnes Âgées (ASPA)",
        slug: "aspa-minimum-vieillesse",
        categorie: "Retraite/Seniors",
        summary_falc: "L'ASPA (anciennement le minimum vieillesse) est une aide d'argent pour les personnes de plus de 65 ans qui ont une petite retraite. Elle permet d'avoir un revenu minimum pour vivre. Elle n'est pas automatique, il faut la demander à la caisse de retraite.",
        cest_quoi: "Une prestation mensuelle pour les retraités ayant de faibles ressources.",
        pour_qui: "Personnes de 65 ans ou plus vivant en France.",
        ce_que_ca_aide: "Garantit un montant de ressources minimal pour le quotidien des seniors.",
        documents_necessaires: ["Dernier avis d'imposition", "Justificatif de domicile"],
        etapes: [
            { numero: 1, titre: "Formulaire", description: "Remplissez le formulaire de demande d'ASPA." }
        ],
        ou_demander: "Votre caisse de retraite (Carsat ou MSA).",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F16871" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["retraite", "senior", "argent", "vieillesse"]
    },
    {
        titre: "Allocation Personnalisée d'Autonomie (APA)",
        slug: "apa-allocation-personnalisee-autonomie",
        categorie: "Retraite/Seniors",
        summary_falc: "L'APA est une aide pour les personnes âgées qui ont du mal à faire les choses du quotidien (se laver, s'habiller, manger). Elle sert à payer quelqu'un pour vous aider à la maison ou à payer une partie du prix de la maison de retraite (EHPAD).",
        cest_quoi: "Une aide pour financer les besoins liés à la perte d'autonomie des seniors.",
        pour_qui: "Personnes de 60 ans ou plus en perte d'autonomie.",
        ce_que_ca_aide: "Dégage des fonds pour payer du personnel d'aide à domicile ou du matériel spécial.",
        documents_necessaires: ["Livret de famille", "Dernier avis d'imposition"],
        etapes: [
            { numero: 1, titre: "Visite à domicile", description: "Une équipe vient chez vous pour voir ce qui est difficile pour vous." }
        ],
        ou_demander: "Conseil Départemental ou CCAS.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F2100" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["aide a domicile", "senior", "ehpad", "mdph"]
    },
    {
        titre: "Aide au ménage (Aide sociale)",
        slug: "aide-menage-seniors",
        categorie: "Retraite/Seniors",
        summary_falc: "Si vous ne pouvez plus faire le ménage ou le repassage à cause de votre âge, votre caisse de retraite ou le département peut payer une partie du prix d'une femme de ménage. C'est pour vous aider à garder votre maison propre en restant chez vous.",
        cest_quoi: "Une prise en charge partielle d'heures d'aide-ménagère à domicile.",
        pour_qui: "Seniors de plus de 65 ans (ou 60 ans si inapte au travail).",
        ce_que_ca_aide: "Prend en charge les tâches ménagères devenues trop fatigantes.",
        documents_necessaires: ["Certificat médical", "Justificatifs de revenus"],
        etapes: [
            { numero: 1, titre: "Dossier", description: "Adressez votre demande au CCAS de votre ville." }
        ],
        ou_demander: "CCAS ou caisse de retraite.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F245" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["proprete", "maison", "senior", "aide"]
    },
    {
        titre: "Téléassistance (Alerte secours)",
        slug: "teleassistance-seniors-secours",
        categorie: "Retraite/Seniors",
        summary_falc: "La téléassistance est un petit bouton que vous portez sur vous (en bracelet ou en collier). Si vous tombez ou si vous avez un malaise, vous appuyez sur le bouton. Une personne vous répond tout de suite et appelle les secours ou votre famille. Certaines mairies paient l'abonnement.",
        cest_quoi: "Un dispositif de sécurité 24h/24 pour alerter les secours en cas de chose ou de malaise.",
        pour_qui: "Seniors vivant seuls à domicile.",
        ce_que_ca_aide: "Apporte de la sécurité et rassure les familles.",
        documents_necessaires: ["Contrat de téléassistance"],
        etapes: [
            { numero: 1, titre: "Installation", description: "Un technicien vient installer le boitier chez vous." }
        ],
        ou_demander: "Mairie ou Conseil Départemental.",
        sources: [{ nom: "Pour les Personnes âgées", url: "https://www.pour-les-personnes-agees.gouv.fr/preserver-son-autonomie-a-domicile/la-teleassistance" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["securite", "chute", "urgence", "senior"]
    },

    // URGENCE (3)
    {
        titre: "Hébergement d'urgence (Le 115)",
        slug: "hebergement-urgence-115",
        categorie: "Urgence",
        summary_falc: "Si vous n'avez pas d'endroit où dormir ce soir, vous devez appeler le 115. C'est un numéro gratuit qui répond 24h sur 24. On essaie de vous trouver une place pour dormir dans un centre d'hébergement. C'est pour les personnes à la rue.",
        cest_quoi: "Un accueil immédiat et gratuit pour toute personne sans abri.",
        pour_qui: "Les personnes sans domicile fixe ou en situation de danger immédiat.",
        ce_que_ca_aide: "Garantit un toit et la sécurité pour la nuit.",
        documents_necessaires: ["Aucun document obligatoirement pour appeler"],
        etapes: [
            { numero: 1, titre: "Appeler le 115", description: "Appelez gratuitement depuis n'importe quel téléphone." },
            { numero: 2, titre: "Expliquer l'urgence", description: "Dites où vous êtes et si vous avez des enfants avec vous." }
        ],
        ou_demander: "Par téléphone : appelez le 115.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F2913" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["nuit", "rue", "froid", "abri"]
    },
    {
        titre: "Aide alimentaire (Colis / Repas)",
        slug: "aide-alimentaire-restos-coeur",
        categorie: "Urgence",
        summary_falc: "Si vous n'avez plus rien à manger et plus d'argent, vous pouvez avoir de l'aide alimentaire. Des associations donnent des colis de nourriture ou des repas chauds gratuits. Par exemple : les Restos du Coeur, le Secours Populaire ou la Banque Alimentaire.",
        cest_quoi: "La distribution de nourriture ou de bons d'achat alimentaires.",
        pour_qui: "Les personnes en situation de grande précarité.",
        ce_que_ca_aide: "Permet de manger tous les jours malgré l'absence de ressources.",
        documents_necessaires: ["Justificatif de ressources si possible"],
        etapes: [
            { numero: 1, titre: "Trouver une association", description: "Renseignez-vous auprès de votre mairie." },
            { numero: 2, titre: "S'inscrire", description: "Certaines associations demandent un dossier de revenus." }
        ],
        ou_demander: "Restos du Coeur, Secours Populaire, Banque Alimentaire, CCAS.",
        sources: [{ nom: "Gouvernement", url: "https://agriculture.gouv.fr/laide-alimentaire-en-france" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["nourriture", "repas", "faim", "manger"]
    },
    {
        titre: "Aide d'urgence aux victimes de violences",
        slug: "aide-urgence-violences-conjugales",
        categorie: "Urgence",
        summary_falc: "Si vous subissez des violences chez vous (violences conjugales), il existe une aide d'argent urgente pour partir et vous mettre en sécurité. Elle est versée très vite (en quelques jours) par la CAF. Vous pouvez la demander même si vous n'avez pas encore porté plainte.",
        cest_quoi: "Une aide financière d'urgence pour les victimes de violences commises par le partenaire.",
        pour_qui: "Toute personne victime de violences conjugales attestées par une plainte, un signalement ou une ordonnance de protection.",
        ce_que_ca_aide: "Permet de payer un hôtel, un premier loyer ou de l'essence pour s'enfuir immédiatement.",
        documents_necessaires: ["Dépôt de plainte ou ordonnance de protection ou signalement police"],
        etapes: [
            { numero: 1, titre: "Se mettre en sécurité", description: "Partez d'abord si vous êtes en danger." },
            { numero: 2, titre: "Demande en ligne", description: "Remplissez le formulaire 'Aide d'urgence pour les victimes de violences' sur caf.fr." }
        ],
        ou_demander: "CAF ou MSA.",
        sources: [{ nom: "CAF", url: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/vie-personnelle/aide-d-urgence-pour-les-victimes-de-violences-conjugales" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["danger", "femme", "police", "argent"]
    },

    // ÉTRANGERS / ADMINISTRATIF (2)
    {
        titre: "Accompagnement administratif (Écrivain public)",
        slug: "accompagnement-administratif-ecrivain-public",
        categorie: "Etrangers/Administratif",
        summary_falc: "Si vous avez du mal à lire ou à écrire le français, ou si vous ne comprenez pas les dossiers compliqués, vous pouvez voir un écrivain public. C'est une personne qui vous aide gratuitement à remplir vos papiers, à écrire des lettres ou à comprendre les courriers reçus. On les trouve souvent dans les mairies ou les médiathèques.",
        cest_quoi: "Une aide gratuite pour la rédaction de courriers et le remplissage de formulaires.",
        pour_qui: "Toute personne ayant des difficultés avec l'écrit ou les démarches administratives.",
        ce_que_ca_aide: "Permet de ne pas faire d'erreurs dans ses dossiers et de bien expliquer son besoin.",
        documents_necessaires: ["Le courrier reçu", "Vos pièces d'identité"],
        etapes: [
            { numero: 1, titre: "Prendre rendez-vous", description: "Vérifiez les horaires des permanences dans votre quartier." }
        ],
        ou_demander: "Mairie (CCAS), Maison de Justice et du Droit, ou centres sociaux.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F1030" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["lettre", "papier", "ecriture", "langue"]
    },
    {
        titre: "Élection de domicile (Domiciliation)",
        slug: "domiciliation-eletion-domicile",
        categorie: "Etrangers/Administratif",
        summary_falc: "Si vous n'avez pas d'adresse pour recevoir votre courrier, vous pouvez demander une domiciliation. On vous donne une adresse officielle. Cela permet de demander vos droits (RSA, APL, Carte Vitale) même si vous n'avez pas de maison ou si vous habitez dans une caravane. C'est gratuit.",
        cest_quoi: "L'octroi d'une adresse administrative pour les personnes sans domicile stable.",
        pour_qui: "Toute personne sans résidence stable ayant un lien avec la commune.",
        ce_que_ca_aide: "Permet de recevoir ses courriers officiels et d'accéder à ses droits légaux.",
        documents_necessaires: ["Preuve de lien avec la ville (par exemple une facture, un travail, une école)"],
        etapes: [
            { numero: 1, titre: "Demander au CCAS", description: "Faites un dossier de demande de domiciliation à la mairie." },
            { numero: 2, titre: "Entretien", description: "Vous rencontrerez un travailleur social pour expliquer votre situation." }
        ],
        ou_demander: "CCAS ou associations agréées.",
        sources: [{ nom: "Service-Public", url: "https://www.service-public.fr/particuliers/vosdroits/F3447" }],
        territoires: ["FRANCE"],
        statut: "publie",
        mots_cles: ["adresse", "courrier", "sdf", "prefection"]
    },

    // MOBILITÉ / TRANSPORT (2)
    {
        titre: "Tarification solidaire des transports (Bus / Tram)",
        slug: "tarif-solidaire-transport-commun",
        categorie: "Mobilite/Transport",
        summary_falc: "Les villes proposent des abonnements de transport (bus, tram) moins chers pour les personnes qui gagnent peu d'argent. Parfois, le bus est même gratuit pour les personnes au RSA. À Strasbourg, on appelle ça la tarification solidaire de la CTS. Il faut montrer son attestation CAF pour avoir ce prix.",
        cest_quoi: "Une réduction du prix du ticket ou de l'abonnement de transport public selon vos revenus.",
        pour_qui: "Les bénéficiaires du RSA, de l'AAH ou de la prime d'activité avec de faibles ressources.",
        ce_que_ca_aide: "Réduit les frais pour aller au travail, en formation ou faire ses courses.",
        documents_necessaires: ["Attestation de quotient familial CAF", "Pièce d'identité"],
        etapes: [
            { numero: 1, titre: "Attestation CAF", description: "Imprimez votre attestation sur caf.fr." },
            { numero: 2, titre: "Aller à l'agence", description: "Présentez le document à l'agence de transport de votre ville." }
        ],
        ou_demander: "Agence de transport (ex: CTS à Strasbourg) ou mairie.",
        sources: [{ nom: "CTS Strasbourg", url: "https://www.cts-strasbourg.eu/fr/Boutique-en-ligne/tarification-solidaire/" }],
        territoires: ["ALSACE", "67", "68"],
        statut: "publie",
        mots_cles: ["bus", "tram", "ticket", "deplacement"]
    },
    {
        titre: "Aide à la location de vélo (Solidarité)",
        slug: "aide-location-velo-solidaire",
        categorie: "Mobilite/Transport",
        summary_falc: "Certaines associations louent des vélos pour presque rien. C'est pour aider les personnes qui n'ont pas de voiture à se déplacer. Le vélo est entretenu par l'association. C'est une bonne solution pour les petits trajets en ville. Parfois, on peut même acheter un vélo d'occasion pas cher.",
        cest_quoi: "La mise à disposition d'un vélo pour un prix très réduit.",
        pour_qui: "Personnes inscrites à France Travail ou ayant de bas revenus.",
        ce_que_ca_aide: "Permet de se déplacer librement sans payer d'essence ou d'assurance voiture.",
        documents_necessaires: ["Certificat de résidence", "Dernier avis d'imposition"],
        etapes: [
            { numero: 1, titre: "Trouver l'association", description: "Cherchez les ateliers de réparation vélo solidaire." }
        ],
        ou_demander: "Associations de type Vélostation ou Emmaüs.",
        sources: [{ nom: "FUB", url: "https://www.fub.fr/ateliers-velo" }],
        territoires: ["ALSACE"],
        statut: "publie",
        mots_cles: ["velo", "sport", "ville", "economie"]
    }
];

async function main() {
    console.log('Seeding ' + aides.length + ' aides...');
    for (const aideData of aides) {
        await prisma.aide.upsert({
            where: { slug: aideData.slug },
            update: aideData,
            create: aideData,
        });
    }
    console.log('Seeding aides complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
