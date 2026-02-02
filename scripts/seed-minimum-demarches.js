
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const demarches = [
    // ÉTRANGERS / PRÉFECTURE (10)
    {
        titre: "Renouveler son titre de séjour (En ligne)",
        slug: "renouveler-titre-sejour-ligne",
        categorie: "Étrangers",
        summary_falc: "Si vous avez déjà un titre de séjour et qu'il va bientôt finir, vous devez demander un nouveau. Maintenant, beaucoup de demandes se font sur internet. Il faut le faire 2 à 4 mois avant la fin de votre carte actuelle. Cela vous permet de continuer à travailler et à habiter en France légalement.",
        etapes: [
            { numero: 1, titre: "Aller sur le site ANEF", description: "L'adresse est administration-etrangers-en-france.interieur.gouv.fr." },
            { numero: 2, titre: "Se connecter", description: "Créez votre compte ou connectez-vous avec votre numéro d'étranger." },
            { numero: 3, titre: "Choisir la démarche", description: "Choisissez 'Je demande ou je renouvelle un titre de séjour'." },
            { numero: 4, titre: "Télécharger les documents", description: "Téléchargez vos justificatifs (photo, domicile, ressources)." },
            { numero: 5, titre: "Valider", description: "Validez la demande et gardez l'attestation de dépôt." }
        ],
        documents_necessaires: ["Titre de séjour actuel", "Justificatif de domicile de moins de 6 mois", "e-Photo d'identité numérique", "Justificatif de ressources"],
        delai: "Le temps d'attente dépend de votre préfecture (souvent plusieurs mois).",
        cout: "Il faut acheter des timbres fiscaux (le prix change selon le titre).",
        lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
        statut: "publie",
        mots_cles: ["prefecture", "titre de sejour", "etranger", "renouvellement"]
    },
    {
        titre: "Première demande de titre de séjour",
        slug: "premiere-demande-titre-sejour",
        categorie: "Étrangers",
        summary_falc: "C'est la première fois que vous demandez un papier pour habiter en France. Il faut souvent prendre rendez-vous à la préfecture de votre département. C'est une démarche importante. Si vous n'avez pas de rendez-vous, vous ne pouvez pas déposer votre dossier.",
        etapes: [
            { numero: 1, titre: "Prendre rendez-vous", description: "Vérifiez sur le site internet de votre préfecture comment prendre rendez-vous." },
            { numero: 2, titre: "Préparer le dossier", description: "Préparez tous vos documents originaux et des copies." },
            { numero: 3, titre: "Aller au guichet", description: "Allez à la préfecture le jour du rendez-vous." },
            { numero: 4, titre: "Enregistrer les empreintes", description: "L'agent vérifie vos papiers et prend vos empreintes." },
            { numero: 5, titre: "Récupérer le récépissé", description: "On vous donne un récépissé (un papier provisoire)." }
        ],
        documents_necessaires: ["Passeport avec visa ou acte de naissance", "Contrat de travail ou preuve de vie familiale", "Justificatif de domicile"],
        delai: "Variable selon la situation.",
        cout: "Gratuit pour le dépôt, payant (timbres fiscaux) à la remise de la carte.",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/N110",
        statut: "publie",
        mots_cles: ["prefecture", "visa", "etranger", "premiere fois"]
    },
    {
        titre: "Demander la Nationalité Française",
        slug: "demander-nationalite-francaise",
        categorie: "Étrangers",
        summary_falc: "Devenir Français s'appelle la naturalisation. Vous demandez à l'État de devenir citoyen français. Il faut habiter en France depuis au moins 5 ans, parler français et connaître l'histoire de la France. C'est une démarche qui se fait maintenant surtout sur internet.",
        etapes: [
            { numero: 1, titre: "Vérifier les conditions", description: "Vérifiez la durée de séjour, le travail et votre niveau de langue." },
            { numero: 2, titre: "Rassemblez les actes", description: "Rassemblez vos actes de naissance et de mariage traduits en français." },
            { numero: 3, titre: "Faire la demande en ligne", description: "Faites la demande sur le site de l'ANEF." },
            { numero: 4, titre: "Passer l'entretien", description: "Passez l'entretien de vérification des connaissances à la préfecture." }
        ],
        documents_necessaires: ["Acte de naissance traduit", "Diplôme de langue française (B1)", "Bordereau fiscal (P237)", "Casier judiciaire"],
        delai: "Long (entre 18 mois et 2 ans en moyenne).",
        cout: "Un timbre fiscal de 95 euros.",
        lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
        statut: "publie",
        mots_cles: ["natinalite", "francais", "citoyen", "naturalisation"]
    },
    {
        titre: "Changement d'adresse sur son titre de séjour",
        slug: "changement-adresse-titre-sejour",
        categorie: "Étrangers",
        summary_falc: "Quand vous déménagez, vous devez dire votre nouvelle adresse à la préfecture. C'est obligatoire. Vous avez 3 mois pour le faire. Si vous ne le faites pas, vous risquez une amende ou des problèmes pour renouveler votre carte plus tard.",
        etapes: [
            { numero: 1, titre: "Site ANEF", description: "Connectez-vous sur le site ANEF." },
            { numero: 2, titre: "Modifier situation", description: "Choisissez 'Modifier ma situation'." },
            { numero: 3, titre: "Saisir adresse", description: "Donnez votre nouvelle adresse et téléchargez le justificatif de domicile." }
        ],
        documents_necessaires: ["Titre de séjour actuel", "Nouveau justificatif de domicile"],
        delai: "Quelques semaines.",
        cout: "25 euros en timbres fiscaux.",
        lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
        statut: "publie",
        mots_cles: ["demenagement", "adresse", "sejour", "obligatoire"]
    },
    {
        titre: "Demande d'Asile",
        slug: "demande-asile-france",
        categorie: "Étrangers",
        summary_falc: "Si vous avez fui votre pays car vous étiez en danger, vous pouvez demander l'asile en France. C'est une protection pour ne pas être renvoyé dans votre pays. Il faut se dépêcher de le faire dès votre arrivée.",
        etapes: [
            { numero: 1, titre: "SPADA", description: "Allez dans une structure d'accueil pour obtenir un rendez-vous au guichet unique." },
            { numero: 2, titre: "Guichet Unique (GUDA)", description: "Allez au rendez-vous Préfecture + OFII. On vous donne une attestation." },
            { numero: 3, titre: "Dossier OFPRA", description: "Remplissez votre dossier en français et envoyez-le sous 21 jours." },
            { numero: 4, titre: "Entretien", description: "Passez l'entretien à l'OFPRA pour expliquer pourquoi vous êtes parti." }
        ],
        documents_necessaires: ["Passeport (si disponible)", "Récit de vie", "Photos"],
        delai: "Plusieurs mois à un an.",
        cout: "Gratuit.",
        lien_officiel: "https://www.ofpra.gouv.fr/",
        statut: "publie",
        mots_cles: ["danger", "protection", "refugie", "ofpra"]
    },
    {
        titre: "Document de Circulation pour l'Étranger Mineur (DCEM)",
        slug: "demande-dcem-enfant",
        categorie: "Étrangers",
        summary_falc: "Le DCEM est un papier pour les enfants étrangers qui habitent en France. Il permet à l'enfant de voyager à l'étranger et de revenir en France sans avoir besoin de visa. Ce n'est pas un titre de séjour.",
        etapes: [
            { numero: 1, titre: "ANEF", description: "Le parent doit faire la demande sur le site de l'ANEF." },
            { numero: 2, titre: "Documents", description: "Télécharger l'acte de naissance de l'enfant et les preuves de scolarité." },
            { numero: 3, titre: "Timbre fiscal", description: "Payez le timbre fiscal sur internet." }
        ],
        documents_necessaires: ["Passeport de l'enfant", "Acte de naissance", "Certificat de scolarité", "Titre de séjour du parent"],
        delai: "1 à 3 mois.",
        cout: "50 euros en timbres fiscaux.",
        lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
        statut: "publie",
        mots_cles: ["enfant", "voyage", "frontiere", "visa"]
    },
    {
        titre: "Demande de Regroupement Familial",
        slug: "regroupement-familial-ofii",
        categorie: "Étrangers",
        summary_falc: "Si vous habitez en France légalement depuis 18 mois, vous pouvez demander à votre famille de venir vous rejoindre. L'OFII vérifie si vous avez assez d'argent et un bon logement.",
        etapes: [
            { numero: 1, titre: "Envoyer le dossier", description: "Envoyez le dossier par courrier à la direction territoriale de l'OFII." },
            { numero: 2, titre: "Visite logement", description: "L'OFII visite votre maison pour vérifier la taille et l'état." },
            { numero: 3, titre: "Décision", description: "Le Préfet prend la décision finale après avis de l'OFII." }
        ],
        documents_necessaires: ["Justificatifs de revenus (12 mois)", "Contrat de bail", "Actes de naissance de la famille"],
        delai: "6 à 18 mois.",
        cout: "Gratuit pour le dépôt.",
        lien_officiel: "https://www.ofii.fr/procedure/regroupement-familial/",
        statut: "publie",
        mots_cles: ["famille", "visa", "ofii", "venir en france"]
    },
    {
        titre: "Titre de voyage pour réfugié",
        slug: "titre-voyage-refugie-ligne",
        categorie: "Étrangers",
        summary_falc: "Si vous êtes reconnu réfugié, vous demandez un titre de voyage à la France. Il vous permet de voyager partout sauf dans votre pays d'origine. C'est votre nouveau passeport.",
        etapes: [
            { numero: 1, titre: "Site ANEF", description: "Faites la demande en ligne sur le site de l'ANEF." },
            { numero: 2, titre: "Décision OFPRA", description: "Donnez votre décision qui prouve que vous êtes réfugié." },
            { numero: 3, titre: "Récupération", description: "Récupérez le titre à la préfecture après paiement du timbre." }
        ],
        documents_necessaires: ["Décision OFPRA", "Photo d'identité", "Justificatif de domicile"],
        delai: "1 à 2 mois.",
        cout: "45 euros.",
        lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
        statut: "publie",
        mots_cles: ["refugie", "voyage", "passeport", "etranger"]
    },
    {
        titre: "Validation du visa long séjour (VLS-TS)",
        slug: "valider-visa-vlsts",
        categorie: "Étrangers",
        summary_falc: "Quand vous arrivez en France avec un visa long séjour, vous devez le valider sur internet dans les 3 mois. C'est ce qui transforme votre visa en titre de séjour officiel.",
        etapes: [
            { numero: 1, titre: "Site internet", description: "Allez sur le site administration-etrangers-en-france.interieur.gouv.fr." },
            { numero: 2, titre: "Saisir visa", description: "Entrez les numéros écrits sur votre visa dans votre passeport." },
            { numero: 3, titre: "Payer taxe", description: "Payez la taxe de séjour avec un timbre fiscal en ligne." }
        ],
        documents_necessaires: ["Passeport avec visa", "Date d'entrée en France", "Timbre fiscal"],
        delai: "Quelques minutes en ligne.",
        cout: "Variable selon le visa.",
        lien_officiel: "https://administration-etrangers-en-france.interieur.gouv.fr/",
        statut: "publie",
        mots_cles: ["visa", "arrivee", "validation", "timbre"]
    },
    {
        titre: "Demande de titre de séjour 'Vie Privée et Familiale'",
        slug: "titre-sejour-vie-privee",
        categorie: "Étrangers",
        summary_falc: "C'est une carte de séjour pour les personnes qui ont des attaches fortes en France (marié à un Français, parents d'enfant français, ou vivant en France depuis longtemps).",
        etapes: [
            { numero: 1, titre: "Rendez-vous", description: "Prenez rendez-vous à la préfecture." },
            { numero: 2, titre: "Preuves d'attaches", description: "Apportez tous les papiers qui montrent votre vie en France." }
        ],
        documents_necessaires: ["Acte de mariage ou naissance enfant", "Justificatifs de vie commune", "Ressources"],
        delai: "4 à 6 mois.",
        cout: "Timbres fiscaux (environ 225€).",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F2209",
        statut: "publie",
        mots_cles: ["famille", "mariage", "enfant", "prefecture"]
    },

    // IDENTITÉ / MAIRIE (6)
    {
        titre: "Faire ou renouveler sa Carte d'Identité",
        slug: "faire-carte-identite-mairie",
        categorie: "Identité",
        summary_falc: "La carte d'identité prouve qui vous êtes. Elle est gratuite si c'est la première fois ou si l'ancienne est périmée. Il faut aller dans une mairie équipée d'une machine à empreintes.",
        etapes: [
            { numero: 1, titre: "Pré-demande en ligne", description: "Allez sur le site de l'ANTS pour gagner du temps." },
            { numero: 2, titre: "Prendre rendez-vous", description: "Prenez rendez-vous dans une mairie équipée (pas forcément la vôtre)." },
            { numero: 3, titre: "Aller en mairie", description: "Donnez vos empreintes et vos papiers." }
        ],
        documents_necessaires: ["Ancienne carte ou déclaration de perte", "Justificatif de domicile", "Photo de moins de 6 mois"],
        delai: "3 à 8 semaines.",
        cout: "Gratuit (25€ si perte ou vol).",
        lien_officiel: "https://passeport.ants.gouv.fr/",
        statut: "publie",
        mots_cles: ["cni", "identite", "carte", "mairie"]
    },
    {
        titre: "Demander son Passeport",
        slug: "demander-passeport-mairie",
        categorie: "Identité",
        summary_falc: "Le passeport sert à voyager en dehors de l'Europe. La demande se fait à la mairie avec un rendez-vous. C'est toujours payant.",
        etapes: [
            { numero: 1, titre: "Acheter timbre", description: "Achetez un timbre fiscal de 86€ en ligne." },
            { numero: 2, titre: "Pré-demande", description: "Faites votre dossier sur le site ANTS." },
            { numero: 3, titre: "Rendez-vous mairie", description: "Allez à la mairie pour les empreintes." }
        ],
        documents_necessaires: ["Timbre fiscal 86€", "Photo d'identité aux normes", "Justificatif de domicile"],
        delai: "4 à 10 semaines.",
        cout: "86€ (adulte).",
        lien_officiel: "https://passeport.ants.gouv.fr/",
        statut: "publie",
        mots_cles: ["voyage", "passeport", "mairie", "etranger"]
    },
    {
        titre: "Inscription sur les listes électorales",
        slug: "inscription-listes-electorales",
        categorie: "Citoyenneté",
        summary_falc: "Pour voter, vous devez être inscrit à la mairie. On peut le faire en ligne sur Service-Public.fr.",
        etapes: [
            { numero: 1, titre: "Vérifier inscription", description: "Vérifiez si vous êtes déjà inscrit sur Service-Public." },
            { numero: 2, titre: "Faire la demande", description: "Utilisez le formulaire en ligne ou allez à la mairie." }
        ],
        documents_necessaires: ["Pièce d'identité", "Justificatif de domicile"],
        delai: "Rapide.",
        cout: "Gratuit.",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/R16396",
        statut: "publie",
        mots_cles: ["vote", "election", "maire", "citoyen"]
    },
    {
        titre: "Recensement citoyen (16 ans)",
        slug: "recensement-citoyen-16-ans",
        categorie: "Citoyenneté",
        summary_falc: "Tous les jeunes Français doivent se faire recenser à 16 ans pour pouvoir passer des examens comme le bac ou le permis.",
        etapes: [
            { numero: 1, titre: "Mairie", description: "Allez à la mairie avec votre carte d'identité." },
            { numero: 2, titre: "Attestation", description: "Gardez précieusement l'attestation donnée par la mairie." }
        ],
        documents_necessaires: ["Carte d'identité", "Livret de famille"],
        delai: "Immédiat.",
        cout: "Gratuit.",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F870",
        statut: "publie",
        mots_cles: ["jeune", "16 ans", "obligatoire", "ecole"]
    },
    {
        titre: "Demander un Acte de Naissance",
        slug: "demander-acte-naissance",
        categorie: "Identité",
        summary_falc: "Besoin d'un acte de naissance ? Demandez-le gratuitement à la mairie de votre naissance.",
        etapes: [
            { numero: 1, titre: "Formulaire", description: "Remplissez le formulaire sur le site de votre mairie de naissance." },
            { numero: 2, titre: "Réception", description: "Attendez de recevoir le papier par courrier." }
        ],
        documents_necessaires: ["Noms et prénoms des parents"],
        delai: "3 à 10 jours.",
        cout: "Gratuit.",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/R1406",
        statut: "publie",
        mots_cles: ["naissance", "papier", "mairie", "famille"]
    },
    {
        titre: "PACS (Pacte Civil de Solidarité)",
        slug: "conclure-un-pacs",
        categorie: "Famille",
        summary_falc: "Un contrat pour deux personnes qui vivent ensemble. On le fait à la mairie.",
        etapes: [
            { numero: 1, titre: "Dossier", description: "Préparez la convention et la déclaration de PACS." },
            { numero: 2, titre: "Rendez-vous", description: "Prenez rendez-vous à la mairie de votre domicile." }
        ],
        documents_necessaires: ["Convention de PACS", "Actes de naissance", "Pièces d'identité"],
        delai: "Selon mairie.",
        cout: "Gratuit en mairie.",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F1618",
        statut: "publie",
        mots_cles: ["couple", "contrat", "mairie", "union"]
    },

    // CAF / MSA (6)
    {
        titre: "Déclarer ses revenus trimestriels (CAF)",
        slug: "declaration-trimestrielle-caf",
        categorie: "Social",
        summary_falc: "Dites à la CAF combien vous gagnez tous les 3 mois pour continuer à recevoir vos aides.",
        etapes: [
            { numero: 1, titre: "Se connecter", description: "Allez sur caf.fr dans 'Mon Compte'." },
            { numero: 2, titre: "Déclarer", description: "Entrez vos salaires reçus chaque mois." }
        ],
        documents_necessaires: ["Fiches de paie des 3 mois"],
        delai: "Immédiat.",
        cout: "Gratuit.",
        lien_officiel: "https://www.caf.fr/",
        statut: "publie",
        mots_cles: ["caf", "rsa", "prime d'activite", "argent"]
    },
    {
        titre: "Changement de situation (CAF)",
        slug: "changement-situation-caf",
        categorie: "Social",
        summary_falc: "Dès qu'un changement arrive dans votre vie (travail, mariage, séparation), dites-le à la CAF.",
        etapes: [
            { numero: 1, titre: "Mon Compte", description: "Allez sur caf.fr." },
            { numero: 2, titre: "Modifier", description: "Cliquez sur 'Déclarer un changement'." }
        ],
        documents_necessaires: ["Justificatif du changement"],
        delai: "Immédiat.",
        cout: "Gratuit.",
        lien_officiel: "https://www.caf.fr/",
        statut: "publie",
        mots_cles: ["demenagement", "mariage", "travail", "caf"]
    },
    {
        titre: "Demander le RSA",
        slug: "demander-rsa-ligne",
        categorie: "Social",
        summary_falc: "Faites votre demande de revenu minimum sur internet.",
        etapes: [
            { numero: 1, titre: "Simulation", description: "Vérifiez vos droits sur caf.fr." },
            { numero: 2, titre: "Demande", description: "Remplissez le dossier en ligne." }
        ],
        documents_necessaires: ["RIB", "Justificatifs revenus", "Avis d'imposition"],
        delai: "1 mois.",
        cout: "Gratuit.",
        lien_officiel: "https://www.caf.fr/",
        statut: "publie",
        mots_cles: ["rsa", "argent", "aide", "caf"]
    },
    {
        titre: "Demander une aide au logement (APL)",
        slug: "demande-apl-caf",
        categorie: "Logement",
        summary_falc: "Demandez une aide pour payer votre loyer à la CAF.",
        etapes: [
            { numero: 1, titre: "Bail", description: "Ayez votre contrat de location prêt." },
            { numero: 2, titre: "Ligne", description: "Faites la demande sur caf.fr." }
        ],
        documents_necessaires: ["Contrat de location (Bail)", "Montant du loyer", "Revenus"],
        delai: "2 mois.",
        cout: "Gratuit.",
        lien_officiel: "https://www.caf.fr/",
        statut: "publie",
        mots_cles: ["loyer", "appartement", "maison", "caf"]
    },
    {
        titre: "Prime à la naissance (PAJE)",
        slug: "demande-prime-naissance",
        categorie: "Famille",
        summary_falc: "Déclarez votre grossesse pour recevoir une prime à la naissance.",
        etapes: [
            { numero: 1, titre: "Médecin", description: "Faites la déclaration de grossesse par le médecin." },
            { numero: 2, titre: "CAF", description: "Dossier envoyé automatiquement par la CPAM à la CAF." }
        ],
        documents_necessaires: ["Déclaration de grossesse"],
        delai: "7ème mois.",
        cout: "Gratuit.",
        lien_officiel: "https://www.caf.fr/",
        statut: "publie",
        mots_cles: ["bebe", "argent", "naissance", "caf"]
    },
    {
        titre: "Signalement fin de droits",
        slug: "signalement-fin-droits-caf",
        categorie: "Social",
        summary_falc: "Dites à la CAF si vos droits s'arrêtent pour éviter de trop percevoir.",
        etapes: [
            { numero: 1, titre: "Notification", description: "Utilisez votre espace en ligne." }
        ],
        documents_necessaires: ["Attestation de fin de droits"],
        delai: "Immédiat.",
        cout: "Gratuit.",
        lien_officiel: "https://www.caf.fr/",
        statut: "publie",
        mots_cles: ["arret", "droits", "caf", "regularisation"]
    },

    // SANTÉ / AMELI (6)
    {
        titre: "Créer son compte Ameli",
        slug: "creer-compte-ameli",
        categorie: "Santé",
        summary_falc: "Votre espace santé sur internet pour voir vos remboursements.",
        etapes: [
            { numero: 1, titre: "Ameli.fr", description: "Allez sur ameli.fr." },
            { numero: 2, titre: "Code", description: "Utilisez FranceConnect ou demandez un code par la poste." }
        ],
        documents_necessaires: ["Numéro sécurité sociale", "RIB"],
        delai: "Immédiat (FranceConnect).",
        cout: "Gratuit.",
        lien_officiel: "https://www.ameli.fr/",
        statut: "publie",
        mots_cles: ["secu", "medecin", "sante", "remboursement"]
    },
    {
        titre: "Perte de Carte Vitale",
        slug: "perte-carte-vitale-ameli",
        categorie: "Santé",
        summary_falc: "Si vous perdez votre carte, dites-le vite sur Ameli et commandez-en une nouvelle.",
        etapes: [
            { numero: 1, titre: "Signaler", description: "Option 'Mes démarches' sur Ameli." },
            { numero: 2, titre: "Commander", description: "Envoyez une photo en ligne." }
        ],
        documents_necessaires: ["Photo", "Carte d'identité"],
        delai: "3 semaines.",
        cout: "Gratuit.",
        lien_officiel: "https://www.ameli.fr/",
        statut: "publie",
        mots_cles: ["carte vitale", "perte", "ameli", "sante"]
    },
    {
        titre: "Complémentaire Santé Solidaire (C2S)",
        slug: "demande-c2s-ameli",
        categorie: "Santé",
        summary_falc: "Une mutuelle gratuite ou pas chère pour les petits revenus.",
        etapes: [
            { numero: 1, titre: "Critères", description: "Regardez l'avis d'imposition." },
            { numero: 2, titre: "Formulaire", description: "Remplissez sur Ameli ou envoyez le papier." }
        ],
        documents_necessaires: ["Avis d'imposition", "Livret de famille"],
        delai: "2 mois.",
        cout: "Gratuit ou < 1€ / jour.",
        lien_officiel: "https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante-solidaire",
        statut: "publie",
        mots_cles: ["mutuelle", "dentiste", "lunettes", "argent"]
    },
    {
        titre: "Carte Européenne (CEAM)",
        slug: "demander-carte-ceam",
        categorie: "Santé",
        summary_falc: "Pour être soigné en Europe pendant les vacances.",
        etapes: [
            { numero: 1, titre: "Commander", description: "Bouton 'CEAM' sur votre compte Ameli." }
        ],
        documents_necessaires: ["Aucun"],
        delai: "15 jours.",
        cout: "Gratuit.",
        lien_officiel: "https://www.ameli.fr/",
        statut: "publie",
        mots_cles: ["vacances", "europe", "sante", "hopital"]
    },
    {
        titre: "Mettre à jour sa Carte Vitale",
        slug: "mettre-a-jour-carte-vitale",
        categorie: "Santé",
        summary_falc: "Une fois par an en pharmacie.",
        etapes: [
            { numero: 1, titre: "Borne", description: "Allez à la pharmacie et utilisez la borne verte." }
        ],
        documents_necessaires: ["Carte Vitale"],
        delai: "1 minute.",
        cout: "Gratuit.",
        lien_officiel: "https://www.ameli.fr/",
        statut: "publie",
        mots_cles: ["pharmacie", "borner", "sante", "actualiser"]
    },
    {
        titre: "Déclarer un accident causé par un tiers",
        slug: "accident-tiers-ameli",
        categorie: "Santé",
        summary_falc: "Si quelqu'un vous blesse, dites-le à l'assurance maladie pour qu'elle se fasse rembourser par l'autre personne.",
        etapes: [
            { numero: 1, titre: "Déclarer", description: "Via le formulaire en ligne sur Ameli." }
        ],
        documents_necessaires: ["Date accident", "Nom de la personne responsable"],
        delai: "Rapide.",
        cout: "Gratuit.",
        lien_officiel: "https://www.ameli.fr/",
        statut: "publie",
        mots_cles: ["accident", "responsable", "argent", "secu"]
    },

    // EMPLOI (6)
    {
        titre: "Inscription France Travail",
        slug: "s-inscrire-france-travail",
        categorie: "Travail",
        summary_falc: "Inscrivez-vous pour chercher un travail et avoir le chômage.",
        etapes: [
            { numero: 1, titre: "Site", description: "Allez sur francetravail.fr." },
            { numero: 2, titre: "Dossier", description: "Écrivez tout votre parcours de travail." }
        ],
        documents_necessaires: ["Attestations employeur", "RIB", "CV"],
        delai: "30 minutes.",
        cout: "Gratuit.",
        lien_officiel: "https://www.francetravail.fr/",
        statut: "publie",
        mots_cles: ["chomage", "travail", "emploi", "conseiller"]
    },
    {
        titre: "Actualisation mensuelle (France Travail)",
        slug: "actualisation-mensuelle-france-travail",
        categorie: "Travail",
        summary_falc: "Chaque mois, dites si vous cherchez toujours un travail.",
        etapes: [
            { numero: 1, titre: "Calendrier", description: "À la fin de chaque mois, allez sur le site ou l'appli." }
        ],
        documents_necessaires: ["Fiches de paie si travail"],
        delai: "Mensuel.",
        cout: "Gratuit.",
        lien_officiel: "https://www.francetravail.fr/",
        statut: "publie",
        mots_cles: ["argent", "mois", "pointer", "travail"]
    },
    {
        titre: "Demande d'aide à la mobilité",
        slug: "aide-mobilite-travail",
        categorie: "Travail",
        summary_falc: "France Travail paie vos déplacements pour un entretien.",
        etapes: [
            { numero: 1, titre: "Avant", description: "Demandez avant d'aller à l'entretien." }
        ],
        documents_necessaires: ["Convocation"],
        delai: "Immédiat.",
        cout: "Aide reçue.",
        lien_officiel: "https://www.francetravail.fr/",
        statut: "publie",
        mots_cles: ["voiture", "train", "entretien", "argent"]
    },
    {
        titre: "Bilan de compétences",
        slug: "bilan-competences-travail",
        categorie: "Travail",
        summary_falc: "Faites le point sur ce que vous savez faire pour changer de métier.",
        etapes: [
            { numero: 1, titre: "Conseiller", description: "Demandez à votre conseiller France Travail." }
        ],
        documents_necessaires: ["CV"],
        delai: "Quelques semaines.",
        cout: "Gratuit via CPF.",
        lien_officiel: "https://www.moncompteformation.gouv.fr/",
        statut: "publie",
        mots_cles: ["changer", "apprendre", "competences", "metier"]
    },
    {
        titre: "Contrat d'Engagement Jeune (CEJ)",
        slug: "demande-cej",
        categorie: "Travail",
        summary_falc: "Un programme intensif pour les jeunes pour trouver un job.",
        etapes: [
            { numero: 1, titre: "Mission Locale", description: "Allez à la Mission Locale ou France Travail." }
        ],
        documents_necessaires: ["Pièce identité"],
        delai: "Rapide.",
        cout: "Allocation reçue.",
        lien_officiel: "https://www.1jeune1solution.gouv.fr/",
        statut: "publie",
        mots_cles: ["jeune", "job", "argent", "accompagnement"]
    },
    {
        titre: "Déclaration accident de travail",
        slug: "accident-travail-declaration",
        categorie: "Travail",
        summary_falc: "Si vous vous blessez au travail, dites-le à votre patron sous 24h.",
        etapes: [
            { numero: 1, titre: "Patron", description: "Dites-le à l'employeur immédiatement." },
            { numero: 2, titre: "Médecin", description: "Allez voir le médecin pour le certificat." }
        ],
        documents_necessaires: ["Certificat médical initial"],
        delai: "24 heures.",
        cout: "Gratuit.",
        lien_officiel: "https://www.ameli.fr/",
        statut: "publie",
        mots_cles: ["blesse", "hopital", "patron", "travail"]
    },

    // IMPÔTS / BUDGET (4)
    {
        titre: "Déclaration d'impôts",
        slug: "declaration-impots-revenu",
        categorie: "Finances",
        summary_falc: "Dites à l'État ce que vous avez gagné l'année dernière.",
        etapes: [
            { numero: 1, titre: "Internet", description: "Allez sur impots.gouv.fr entre avril et juin." }
        ],
        documents_necessaires: ["Revenus de l'année"],
        delai: "Annuel.",
        cout: "Gratuit.",
        lien_official: "https://www.impots.gouv.fr/",
        statut: "publie",
        mots_cles: ["fisc", "argent", "revenus", "obligatoire"]
    },
    {
        titre: "Prélèvement à la source (Modifier)",
        slug: "modifier-prelevement-source",
        categorie: "Finances",
        summary_falc: "Changez le montant de l'impôt pris sur votre salaire si vos revenus changent.",
        etapes: [
            { numero: 1, titre: "Espace Particulier", description: "Gérer mon prélèvement à la source sur impots.gouv.fr." }
        ],
        documents_necessaires: ["Nouveaux revenus prévus"],
        delai: "Immédiat.",
        cout: "Gratuit.",
        lien_officiel: "https://www.impots.gouv.fr/",
        statut: "publie",
        mots_cles: ["salaire", "impot", "argent", "modifier"]
    },
    {
        titre: "Demande de remise gracieuse",
        slug: "remise-gracieuse-impots",
        categorie: "Finances",
        summary_falc: "Demandez à ne pas payer l'amende des impôts si vous avez un gros problème.",
        etapes: [
            { numero: 1, titre: "Lettre", description: "Écrivez via la messagerie sécurisée." }
        ],
        documents_necessaires: ["Justificatif difficulté"],
        delai: "1 mois.",
        cout: "Gratuit.",
        lien_officiel: "https://www.impots.gouv.fr/",
        statut: "publie",
        mots_cles: ["dette", "pardon", "argent", "impots"]
    },
    {
        titre: "Droit au compte bancaire",
        slug: "droit-au-compte-banque",
        categorie: "Finances",
        summary_falc: "Si aucune banque ne veut de vous, la Banque de France vous aidera.",
        etapes: [
            { numero: 1, titre: "Refus", description: "Demandez la lettre de refus à la banque." },
            { numero: 2, titre: "Banque de France", description: "Saisissez la Banque de France." }
        ],
        documents_necessaires: ["Lettre de refus", "ID"],
        delai: "2 jours.",
        cout: "Gratuit.",
        lien_officiel: "https://www.banque-france.fr/",
        statut: "publie",
        mots_cles: ["banque", "rib", "argent", "refus"]
    },

    // TRANSPORT / VÉHICULE (4)
    {
        titre: "Carte Grise (Certificat d'immatriculation)",
        slug: "demander-carte-grise-ants",
        categorie: "Transport",
        summary_falc: "Papiers de la voiture quand vous l'achetez ou déménagez.",
        etapes: [
            { numero: 1, titre: "ANTS", description: "Tout se fait sur immatriculation.ants.gouv.fr." }
        ],
        documents_necessaires: ["Cession de véhicule", "ID", "Justificatif domicile"],
        delai: "1 semaine.",
        cout: "Payant (taxe régionale).",
        lien_officiel: "https://immatriculation.ants.gouv.fr/",
        statut: "publie",
        mots_cles: ["voiture", "vendre", "acheter", "papier"]
    },
    {
        titre: "Renouveler permis de conduire",
        slug: "renouveler-permis-ants",
        categorie: "Transport",
        summary_falc: "Si votre permis est vieux ou perdu.",
        etapes: [
            { numero: 1, titre: "ANTS", description: "Faites la demande sur le site ANTS." }
        ],
        documents_necessaires: ["Photo", "ID", "Code photo numérique"],
        delai: "4 semaines.",
        cout: "Gratuit (25€ si perte).",
        lien_officiel: "https://permisdeconduire.ants.gouv.fr/",
        statut: "publie",
        mots_cles: ["volant", "permis", "perdu", "conduire"]
    },
    {
        titre: "Vendre son véhicule (Déclaration)",
        slug: "déclarer-vente-vehicule",
        categorie: "Transport",
        summary_falc: "Dites à l'État que vous avez vendu votre voiture.",
        etapes: [
            { numero: 1, titre: "Cession", description: "Remplissez le certificat de cession avec l'acheteur." },
            { numero: 2, titre: "ANTS", description: "Enregistrez la vente sur le site ANTS." }
        ],
        documents_necessaires: ["Certificat de cession"],
        delai: "10 minutes.",
        cout: "Gratuit.",
        lien_officiel: "https://immatriculation.ants.gouv.fr/",
        statut: "publie",
        mots_cles: ["vendre", "voiture", "code cession", "ants"]
    },
    {
        titre: "Crit'Air (Vignette pollution)",
        slug: "commander-vignette-critair",
        categorie: "Transport",
        summary_falc: "Une étiquette pour rouler dans les grandes villes.",
        etapes: [
            { numero: 1, titre: "Site officiel", description: "Commandez sur certificat-air.gouv.fr." }
        ],
        documents_necessaires: ["Carte grise"],
        delai: "10 jours.",
        cout: "3.72€.",
        lien_officiel: "https://www.certificat-air.gouv.fr/",
        statut: "publie",
        mots_cles: ["pollution", "ville", "ecologie", "voiture"]
    },

    // LOGEMENT (2)
    {
        titre: "Demande de logement social (HLM)",
        slug: "demande-logement-social-hlm",
        categorie: "Logement",
        summary_falc: "Inscrivez-vous pour avoir un appartement moins cher.",
        etapes: [
            { numero: 1, titre: "Dossier", description: "Faites le dossier sur demande-logement-social.gouv.fr." },
            { numero: 2, titre: "Numéro Unique", description: "Gardez votre numéro d'enregistrement." }
        ],
        documents_necessaires: ["ID", "Avis d'imposition"],
        delai: "Très long.",
        cout: "Gratuit.",
        lien_officiel: "https://www.demande-logement-social.gouv.fr/",
        statut: "publie",
        mots_cles: ["hlm", "appartement", "maison", "social"]
    },
    {
        titre: "Chèque Énergie",
        slug: "utiliser-cheque-energie",
        categorie: "Énergie",
        summary_falc: "Une aide reçue par la poste pour payer l'électricité ou le gaz.",
        etapes: [
            { numero: 2, titre: "Utiliser", description: "Donnez le chèque à votre fournisseur ou payez en ligne." }
        ],
        documents_necessaires: ["Chèque reçu", "Facture énergie"],
        delai: "Annuel.",
        cout: "Aide reçue.",
        lien_officiel: "https://chequeenergie.gouv.fr/",
        statut: "publie",
        mots_cles: ["edf", "gaz", "electricite", "argent"]
    }
];

// Verify we have 50 (10+6+6+6+6+4+4+2 = 44... I need 6 more)
demarches.push(
    {
        titre: "Aide Juridictionnelle",
        slug: "aide-juridictionnelle-justice",
        categorie: "Justice",
        summary_falc: "L'État paie votre avocat si vous n'avez pas d'argent.",
        etapes: [{ numero: 1, titre: "Formulaire", description: "Tribunal ou internet." }],
        documents_necessaires: ["Revenus", "ID"],
        delai: "1 mois.",
        cout: "Gratuit.",
        lien_officiel: "https://www.justice.fr/",
        statut: "publie",
        mots_cles: ["avocat", "tribunal", "justice", "argent"]
    },
    {
        titre: "Saisir le Médiateur",
        slug: "saisir-mediateur-consommation",
        categorie: "Droit",
        summary_falc: "Si vous avez un problème avec un magasin ou Orange/EDF.",
        etapes: [{ numero: 1, titre: "Contact", description: "Faites d'abord une lettre au service client." }],
        documents_necessaires: ["Preuves achat"],
        delai: "3 mois.",
        cout: "Gratuit.",
        lien_officiel: "https://www.economie.gouv.fr/mediation-conso",
        statut: "publie",
        mots_cles: ["dispute", "remboursement", "magasin", "aide"]
    },
    {
        titre: "Demander une Bourse Étudiante",
        slug: "bourse-crous-etudiant",
        categorie: "Études",
        summary_falc: "De l'argent pour les étudiants.",
        etapes: [{ numero: 1, titre: "DSE", description: "Faites le Dossier Social Étudiant sur Messervices.etudiant.gouv.fr." }],
        documents_necessaires: ["Revenus parents", "ID student"],
        delai: "L'été avant la rentrée.",
        cout: "Gratuit.",
        lien_officiel: "https://www.messervices.etudiant.gouv.fr/",
        statut: "publie",
        mots_cles: ["fac", "ecole", "argent", "crous"]
    },
    {
        titre: "Cantine à 1 euro",
        slug: "cantine-un-euro-demande",
        categorie: "Scolarité",
        summary_falc: "Manger à l'école pour pas cher.",
        etapes: [{ numero: 1, titre: "Vérifier", description: "Regardez si votre commune le propose." }],
        documents_necessaires: ["Quotient familial CAF"],
        delai: "Immédiat.",
        cout: "1€.",
        lien_officiel: "https://www.service-public.fr/",
        statut: "publie",
        mots_cles: ["repas", "ecole", "enfant", "prix"]
    },
    {
        titre: "Élection domicile (CCAS)",
        slug: "election-domicile-sdf",
        categorie: "Social",
        summary_falc: "Avoir une adresse pour recevoir son courrier quand on est à la rue.",
        etapes: [{ numero: 1, titre: "CCAS", description: "Allez au CCAS de la ville." }],
        documents_necessaires: ["ID"],
        delai: "15 jours.",
        cout: "Gratuit.",
        lien_officiel: "https://www.service-public.fr/particuliers/vosdroits/F3447",
        statut: "publie",
        mots_cles: ["rue", "courrier", "adresse", "social"]
    },
    {
        titre: "Signalement travaux dangereux",
        slug: "signalement-travaux-logement",
        categorie: "Logement",
        summary_falc: "Si votre maison est dangereuse (salpêtre, fils électriques nus).",
        etapes: [{ numero: 1, titre: "Mairie", description: "Contactez le service hygiène de la mairie." }],
        documents_necessaires: ["Photos"],
        delai: "Variable.",
        cout: "Gratuit.",
        lien_officiel: "https://www.service-public.fr/",
        statut: "publie",
        mots_cles: ["danger", "maison", "proprietaire", "insalubre"]
    }
);

async function main() {
    console.log('Seeding ' + demarches.length + ' demarches...');
    for (const demarcheData of demarches) {
        // Ensure all fields map correctly
        const finalData = {
            titre: demarcheData.titre,
            slug: demarcheData.slug,
            categorie: demarcheData.categorie,
            summary_falc: demarcheData.summary_falc,
            etapes: demarcheData.etapes || [],
            documents_necessaires: demarcheData.documents_necessaires || [],
            delai: demarcheData.delai,
            cout: demarcheData.cout,
            lien_officiel: demarcheData.lien_officiel,
            statut: demarcheData.statut || "publie",
            mots_cles: demarcheData.mots_cles || []
        };

        await prisma.demarche.upsert({
            where: { slug: finalData.slug },
            update: finalData,
            create: finalData,
        });
    }
    console.log('Seeding demarches complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
