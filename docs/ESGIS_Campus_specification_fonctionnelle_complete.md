# ESGIS Campus — Specification Fonctionnelle Complete

Ce document est la cible fonctionnelle de reference du projet.

- Source: specification fournie par le porteur du projet le 3 avril 2026
- Regle de suivi: toute evolution produit, priorisation fonctionnelle, refonte UX, modelisation de donnees ou implementation technique doit etre evaluee par rapport a cette specification
- Statut: objectif produit a atteindre

## 1. Vision & Philosophie de la Plateforme

ESGIS Campus est un ecosysteme numerique universitaire integre, concu pour centraliser l'ensemble de la vie academique: enseignement, administration, communication et evaluation. L'objectif est d'eliminer les silos entre les acteurs (etudiants, professeurs, administration), de dematerialiser les processus papier couteux et lents, et de creer une experience fluide, moderne et securisee accessible depuis n'importe quel appareil.

La plateforme repose sur trois piliers:

- Accessibilite: interface web responsive et application mobile native (iOS & Android)
- Fiabilite: integrite des donnees academiques, tracabilite de toutes les actions
- Securite: controle d'acces strict par role, examens infalsifiables, documents officiels authentifies

## 2. Les Quatre Profils Utilisateurs

| Profil | Perimetre |
| --- | --- |
| Etudiant | Acces a son parcours academique, ressources, examens, documents officiels |
| Professeur | Gestion pedagogique de ses cours, evaluations, suivi des etudiants |
| Administration | Gestion globale de l'etablissement, acces aux donnees transversales |
| Super Administrateur | Configuration systeme, gestion des droits, supervision technique |

## 3. Profil ETUDIANT — Fonctionnalites Detaillees

### 3.1 Tableau de Bord Etudiant

L'ecran d'accueil est le centre de gravite de l'experience etudiant. Il affiche en un coup d'oeil:

- Carte d'identite academique: photo, nom, numero etudiant, filiere, niveau, annee academique en cours
- Resume du jour: prochain cours dans le calendrier, delai avant le prochain examen, derniere note publiee
- Notifications actives: nouveau cours depose, resultat d'examen disponible, annonce administrative, offre de stage
- Progression globale: jauge visuelle des UE (unites d'enseignement) validees sur le semestre en cours
- Acces rapide: 6 raccourcis vers les modules les plus utilises, personnalisables par l'etudiant

### 3.2 Espace Cours & Ressources Pedagogiques

#### Bibliotheque de cours personnelle

L'etudiant accede a l'ensemble des cours correspondant a sa filiere et a son niveau. Les ressources sont organisees par:

- Matiere -> Chapitre -> Type de document (cours, TD, TP, corrige, annexe)
- Semestre (S1, S2, etc.)
- Statut: Nouveau / Lu / Telecharge / Favori

Chaque ressource affiche: le nom du professeur deposant, la date de depot, le nombre de telechargements, le format (PDF, video, presentation, archive), et le poids du fichier. L'etudiant peut telecharger pour un usage hors-ligne, ajouter aux favoris, et laisser une reaction (utile / tres utile / a ameliorer) pour aider les professeurs a jauger la qualite percue.

#### Moteur de recherche interne

Une barre de recherche permet de retrouver un document par mot-cle dans le titre, la description, le nom du professeur ou la matiere.

### 3.3 Calendrier & Emploi du Temps

Affichage multi-vues: journalier, hebdomadaire, mensuel. Chaque evenement est code par couleur selon son type:

- Bleu: cours magistral
- Vert: travaux pratiques
- Jaune: travaux diriges
- Rouge: examen / controle
- Orange: evenement universitaire
- Noir: conge / jour ferie

Au clic sur un evenement: salle, professeur, duree, matiere concernee, et eventuellement un lien vers le cours associe. L'etudiant peut exporter son emploi du temps en PDF ou le synchroniser avec Google Calendar / Apple Calendar via un lien iCal personnel.

Les alertes personnalisees permettent de recevoir des rappels (la veille, 2h avant) par notification push ou e-mail.

### 3.4 Notes & Resultats Academiques

#### Vue des notes par matiere

Pour chaque matiere, l'etudiant voit:

- Toutes ses notes de controles continus (CC), avec coefficient
- Sa note d'examen final
- La moyenne calculee automatiquement avec ponderation
- La mention associee (Passable, Assez Bien, Bien, Tres Bien)
- La comparaison avec la moyenne de la promotion (affichee de facon anonymisee)

#### Releve de notes semestriel

Vue synthetique de toutes les matieres du semestre avec calcul de la moyenne generale ponderee, du rang dans la promotion, et du statut de validation de chaque UE. Un bandeau indique clairement si l'etudiant est admis, admis avec compensation, ajourne ou en rattrapage.

#### Historique academique complet

L'etudiant peut naviguer dans l'ensemble de son parcours, semestre par semestre, depuis son inscription.

### 3.5 Examens en Ligne (Module Quiz)

(Ce module est developpe en detail dans la section 6)

L'etudiant accede a la liste de ses examens planifies avec:

- Statut: A venir / En cours / Termine / Note
- Date et heure d'ouverture, duree autorisee
- Matiere et professeur concerne
- Instructions speciales laissees par le prof

Avant de demarrer un examen, l'etudiant doit confirmer son identite (via code de verification envoye par e-mail/SMS ou validation biometrique sur mobile) et accepter le reglement d'examen. Une fois lance, l'environnement d'examen est securise.

### 3.6 Espace Documents Officiels

C'est l'un des modules les plus strategiques: la dematerialisation complete des documents administratifs.

#### Documents disponibles en auto-service

- Certificat de scolarite: genere a la demande, horodate, signe numeriquement avec QR code de verification. L'etudiant peut en generer autant qu'il veut pour l'annee academique en cours
- Attestation d'inscription: document confirmant l'inscription a une formation specifique
- Releve de notes officiel: version PDF officielle avec cachet electronique de l'institution, telechargeable une fois les notes publiees et validees par l'administration
- Bulletin semestriel: synthese complete du semestre incluant appreciations des professeurs, moyenne, decision du jury
- Attestation de reussite / Diplome: disponible uniquement apres validation administrative, avec QR code d'authenticite

#### Mecanisme d'authenticite

Chaque document genere possede un identifiant unique et un QR code. Toute personne (employeur, ambassade, autre institution) peut scanner ce QR code pour verifier l'authenticite du document sur une page publique de verification ESGIS, sans avoir acces a d'autres donnees de l'etudiant.

#### Historique des documents generes

L'etudiant voit la liste de tous les documents qu'il a telecharges avec date et heure.

### 3.7 Offres de Stages & Emplois

Tableau de bord des opportunites publiees par l'administration ou les partenaires:

- Titre du poste, entreprise, secteur, localisation
- Date de publication et date limite de candidature
- Description detaillee, profil recherche, remuneration eventuelle
- Bouton de candidature directe (envoi du CV stocke dans son profil) ou redirection externe

L'etudiant peut filtrer par domaine, duree (stage court, stage de fin d'etude, emploi), et sauvegarder des offres en favoris. Un systeme d'alerte l'avertit quand une nouvelle offre correspond a son profil.

### 3.8 Messagerie & Communication

- Messagerie interne securisee: l'etudiant peut ecrire a ses professeurs (pas d'e-mail externe necessaire), a l'administration, ou aux services concernes (scolarite, comptabilite, etc.)
- Fil d'annonces: flux chronologique des annonces officielles de l'universite (evenements, modifications de planning, communiques)
- Forum par matiere: espace d'echange entre etudiants d'une meme classe sur une matiere donnee, modere par le professeur

### 3.9 Profil & Parametres

- Modification de la photo de profil
- Mise a jour des informations de contact (telephone, e-mail secondaire, adresse)
- Gestion des preferences de notification (push, e-mail, SMS)
- Changement du mot de passe
- Televersement et mise a jour du CV (utilise pour les candidatures stages)
- Langue de l'interface (Francais / Anglais)

## 4. Profil PROFESSEUR — Fonctionnalites Detaillees

### 4.1 Tableau de Bord Professeur

Vue synthetique montrant:

- Mes cours en cours: liste des matieres enseignees ce semestre avec le nombre d'etudiants inscrits
- Activite recente: dernieres connexions, derniers documents telecharges par les etudiants
- A faire: examens a corriger, notes a publier, questions en attente dans les forums
- Statistiques rapides: taux de consultation des cours deposes, taux de completion des examens

### 4.2 Gestion des Ressources Pedagogiques

#### Deposer un nouveau document

Interface de depot intuitive en glisser-deposer (drag & drop) avec:

- Selection de la matiere, du chapitre/theme, du type (cours, TD, TP, corrige, autre)
- Titre et description facultative
- Choix de la visibilite: toutes les promotions ayant cette matiere, ou selection manuelle de groupes
- Option de publication immediate ou programmee (ex.: publier le 15 avril a 8h00)
- Formats acceptes: PDF, Word, PowerPoint, Excel, video MP4, archive ZIP, image

#### Gestion de la bibliotheque

Le professeur voit l'ensemble de ses documents deposes avec:

- Statistiques par document (nombre de vues, telechargements, reactions des etudiants)
- Option de modification (remplacement du fichier, mise a jour de la description)
- Archivage ou suppression
- Reorganisation par glisser-deposer dans l'arborescence des chapitres

#### Gestion des programmes

Le professeur peut deposer le syllabus de sa matiere: plan du cours, objectifs pedagogiques, bibliographie, modalites d'evaluation. Ce document est affiche en bonne place dans l'espace cours pour les etudiants.

### 4.3 Gestion des Notes

#### Saisie des notes

Interface tableur integree avec liste des etudiants de la promotion. Le professeur saisit:

- Notes de controles continus (plusieurs colonnes possibles avec coefficient)
- Note d'examen final
- Appreciation textuelle facultative (visible uniquement dans le bulletin)

La plateforme calcule automatiquement les moyennes ponderees en temps reel. Le professeur peut importer un fichier Excel si les notes ont ete saisies hors-ligne, avec validation automatique du format.

#### Verification avant publication

Avant de publier les notes, le professeur accede a une vue de revue: statistiques de la promotion (moyenne de classe, note min/max, repartition par mention), liste des etudiants absents ou non notes. Il doit confirmer explicitement la publication — action irreversible sauf correction administrative.

#### Correction d'une note

Si une erreur est detectee apres publication, le professeur soumet une demande de correction a l'administration avec justification. L'administration valide ou rejette. La modification est tracee dans l'historique.

### 4.4 Creation & Gestion des Examens en Ligne

(Detaille en section 6)

#### Createur d'examen

- Interface de construction d'examen par blocs de questions
- Types de questions: QCM simple, QCM multiple, Vrai/Faux, texte court, texte long, association, ordonnancement, reponse numerique
- Import de questions depuis une banque personnelle ou la banque partagee de l'etablissement
- Parametrage complet: duree, fenetre de passage (de telle heure a telle heure), nombre de tentatives autorisees, melange des questions, melange des reponses dans les QCM, note de passage
- Options anti-triche avancees (decrites en section 6)
- Assignation a une ou plusieurs promotions/groupes

#### Suivi en temps reel

Pendant un examen en cours, le professeur peut voir:

- Nombre d'etudiants connectes / ayant demarre / ayant termine
- Duree restante pour chaque etudiant
- Alertes d'incidents (tentative de sortie du navigateur, deconnexion)

#### Correction & notation

Pour les QCM: correction automatique et notation instantanee apres soumission. Pour les questions a reponse libre: interface de correction manuelle avec affichage de la reponse de l'etudiant, saisie de la note et d'un commentaire, vue cote-a-cote avec le bareme. Le professeur peut corriger question par question (toutes les reponses d'etudiants a la Q1) ou etudiant par etudiant.

### 4.5 Suivi des Etudiants

#### Vue par promotion

Liste de tous les etudiants avec indicateurs:

- Taux de presence (si gestion d'emargement activee)
- Moyenne actuelle dans la matiere
- Derniere connexion a l'espace cours
- Indicateur d'alerte si l'etudiant est en difficulte (moyenne < seuil defini)

#### Fiche individuelle etudiant

Au clic sur un etudiant, le professeur voit le detail de son parcours dans sa matiere: toutes ses notes, ses examens passes, ses activites sur la plateforme (sans donnees privees), et peut lui envoyer un message direct.

### 4.6 Gestion de l'Emploi du Temps Personnel

Le professeur consulte son planning d'enseignement: creneaux, salles, promotions. Il peut soumettre des demandes d'absence ou d'echange de creneaux a l'administration directement depuis la plateforme.

### 4.7 Banque de Questions

Chaque professeur dispose d'une banque de questions personnelle, organisee par matiere, theme et difficulte (facile / moyen / difficile). Il peut reutiliser des questions existantes pour creer de nouveaux examens sans ressaisie. Une banque commune a l'etablissement peut etre alimentee avec validation administrative, permettant la mutualisation des ressources.

### 4.8 Messagerie & Annonces

- Messagerie avec les etudiants de ses promotions
- Publication d'annonces ciblees visibles dans le fil de l'etudiant (ex: "Le TP3 est reporte", "Les notes du partiel sont disponibles")
- Moderation du forum de sa matiere

## 5. Profil ADMINISTRATION — Fonctionnalites Detaillees

### 5.1 Tableau de Bord Administratif

Vue de controle globale de l'etablissement:

- Indicateurs cles: nombre d'etudiants actifs, nombre de professeurs, taux de connexion quotidien, documents generes aujourd'hui
- Activites recentes: dernieres inscriptions, dernieres publications de notes, derniers examens passes
- Alertes systeme: comptes en attente d'activation, documents en attente de validation, incidents signales
- Calendrier institutionnel: vue du planning global de l'etablissement

### 5.2 Gestion des Etudiants

#### Dossier etudiant complet

Chaque etudiant possede un dossier numerique centralise contenant:

- Informations personnelles (identite, coordonnees, photo)
- Documents d'inscription (piece d'identite, photo, diplomes anterieurs)
- Parcours academique complet (toutes les annees)
- Statut financier (frais de scolarite payes / en attente / exonere)
- Historique des documents officiels generes
- Journal d'activite sur la plateforme

#### Creation & Activation de compte

L'administration cree les comptes etudiants a l'inscription (manuellement ou par import CSV/Excel d'un fichier de nouvelles inscriptions). Elle genere et envoie les identifiants de connexion par e-mail automatiquement. Elle peut activer, desactiver ou suspendre un compte a tout moment (ex: suspension pour impaye, retrait de l'etablissement).

#### Affectation aux promotions

Attribution de l'etudiant a sa filiere, niveau, groupe, et semestre. Possibilite de gerer les reorientations, les redoublements (l'etudiant est replace sur le semestre approprie) et les passerelles entre filieres.

#### Gestion des paiements & statut financier

Suivi des frais de scolarite: montant du, versements effectues, solde restant, historique des paiements. Generation de recus de paiement officiels. Parametrage de regles automatiques (ex: blocage du compte si impaye apres 30 jours).

### 5.3 Gestion des Professeurs

- Creation et gestion des comptes professeurs
- Attribution des matieres et promotions enseignees
- Suivi de l'activite pedagogique (ressources deposees, examens crees, notes publiees)
- Validation des demandes de correction de notes soumises par les professeurs

### 5.4 Gestion des Filieres & Programmes

#### Parametrage academique

L'administration definit et maintient la structure academique complete:

- Filieres (Informatique, Gestion, Droit, etc.)
- Niveaux (L1, L2, L3, M1, M2)
- Semestres et annees academiques
- Matieres (avec coefficient, credits ECTS, type: fondamentale/optionnelle)
- Maquettes pedagogiques (quelles matieres pour quelle filiere a quel niveau)

#### Publication des programmes officiels

L'administration publie les programmes officiels visibles par tous les etudiants des filieres concernees (emploi du temps global, calendrier des examens, calendrier academique).

### 5.5 Gestion des Documents Officiels

#### Parametrage des templates

L'administration configure les modeles de documents officiels: en-tete avec logo ESGIS, informations institutionnelles, champs automatiques (nom etudiant, filiere, etc.), signature numerique du directeur ou du responsable scolarite.

#### File d'attente des demandes

Certains documents necessitent une validation manuelle avant d'etre mis a disposition de l'etudiant (releve de notes officiel, attestations speciales, diplomes). L'administration voit la file des demandes en attente et valide ou rejette avec un commentaire.

#### Generation en lot

A la fin d'un semestre, l'administration peut generer en masse les bulletins de toute une promotion en un clic, puis les mettre a disposition simultanement de tous les etudiants concernes.

#### Mise a disposition manuelle

L'administration peut deposer directement dans le dossier d'un etudiant un document personnalise: attestation particuliere, courrier officiel, document de jury.

### 5.6 Offres de Stages & Partenariats

Publication et gestion des offres de stages/emplois:

- Creation d'une offre avec tous les details
- Ciblage par filiere, niveau et competences
- Gestion des candidatures recues: liste des etudiants candidats, transmission a l'entreprise partenaire
- Gestion du carnet de partenaires entreprises: fiche entreprise, historique des collaborations

### 5.7 Gestion du Calendrier Institutionnel

Interface de gestion du calendrier academique global:

- Creation des creneaux de cours (avec affectation salle, professeur, groupe)
- Planification des examens avec reservation de salles
- Gestion des jours feries et conges universitaires
- Publication du calendrier officiel aux etudiants et professeurs

### 5.8 Communication & Annonces

- Publication d'annonces officielles visibles par tous, par filiere, ou par niveau
- Envoi de notifications push/e-mail ciblees
- Gestion des newsletters periodiques de l'etablissement

### 5.9 Rapports & Analytics

Tableau de bord analytique avec:

- Rapport de reussite par filiere: taux de passage, moyennes, distribution des mentions
- Rapport de frequentation: connexions par jour/semaine, ressources les plus consultees
- Rapport financier: etat des paiements par promotion, taux de recouvrement
- Rapport d'activite pedagogique: nombre de ressources deposees, examens passes, notes publiees
- Export de tous les rapports en PDF ou Excel

## 6. Module d'Examens en Ligne — Architecture Detaillee

C'est le module le plus critique de la plateforme. Il doit garantir l'equite, l'integrite et la securite des evaluations.

### 6.1 Types de Questions Supportes

| Type | Description |
| --- | --- |
| QCM a reponse unique | Une seule bonne reponse parmi 2 a 6 choix |
| QCM a reponses multiples | Plusieurs reponses correctes possibles |
| Vrai / Faux | Question binaire |
| Reponse courte | Zone de saisie libre courte (1 ligne) |
| Reponse longue / Dissertation | Zone de saisie etendue avec compteur de mots |
| Numerique | Saisie d'un nombre avec tolerance d'erreur parametrable |
| Association / Correspondance | Relier des elements de deux colonnes |
| Ordonnancement | Remettre des elements dans le bon ordre |
| Completion de texte a trous | Remplir les cases vides d'un texte |
| Question sur image | Image affichee, etudiant repond a son sujet |

### 6.2 Parametres de Configuration d'un Examen

#### Temporalite

- Date et heure d'ouverture de la fenetre de passage
- Date et heure de fermeture (passe ce delai, plus possible de commencer)
- Duree individuelle allouee (ex: 90 minutes) — compte a rebours par etudiant
- Tolerance de fin (ex: 5 min supplementaires si deconnexion prouvee)

#### Acces

- Promotions/groupes autorises
- Possibilite de whitelist individuelle (etudiant rattrapant)
- Code d'acces optionnel (mot de passe a distribuer en salle)
- Nombre de tentatives (1 seule pour examen officiel, plusieurs pour quiz d'entrainement)

#### Presentation des questions

- Toutes les questions sur une seule page ou question par question (sans retour arriere possible en mode strict)
- Melange aleatoire de l'ordre des questions (chaque etudiant a un ordre different)
- Melange aleatoire des options de reponse dans les QCM
- Tirage aleatoire d'un sous-ensemble depuis un pool de questions (ex: 20 questions tirees au sort parmi 60)

#### Notation

- Points par question (parametrable individuellement)
- Penalite pour mauvaise reponse (pour les QCM, decourager le cochage aleatoire)
- Note de passage
- Affichage ou non du score a l'etudiant apres soumission

### 6.3 Mesures Anti-Triche

#### Niveau navigateur (Browser Lockdown)

- Detection de sortie de l'onglet/fenetre: chaque sortie est enregistree avec horodatage et signalee au professeur. Au bout de X sorties, l'examen est automatiquement soumis ou verrouille
- Desactivation du copier-coller sur les questions
- Desactivation du clic droit
- Detection du passage en arriere-plan (l'etudiant a change de fenetre)
- Mode plein ecran obligatoire (sur desktop) — une alerte s'affiche si l'etudiant en sort

#### Niveau question

- Questions randomisees: deux etudiants voisins ont des ordres de questions differents
- Reponses melangees: meme si les questions sont identiques, l'ordre des choix change
- Tirage aleatoire depuis un pool large: statistiquement peu probable d'avoir exactement les memes questions

#### Niveau identite

- Authentification renforcee avant le demarrage (code OTP envoye par e-mail ou SMS)
- Sur mobile: authentification biometrique possible (empreinte/face ID)
- Journal de connexion: IP, appareil, navigateur enregistres

#### Rapport d'integrite

Apres chaque examen, le professeur recoit un rapport d'integrite automatique listant les incidents detectes: sorties d'onglet, reconnexions, temps anormalement courts sur certaines questions, similarite entre copies (detection de reponses identiques sur questions ouvertes).

### 6.4 Experience Etudiant pendant l'Examen

L'interface d'examen est epuree, sans aucun menu ou lien externe:

- En-tete: nom de l'examen, matiere, compte a rebours visible en permanence, bouton de soumission
- Navigation laterale: numeros de questions avec indicateurs (non repondu / repondu / marque pour relecture)
- Zone principale: affichage de la question et des choix de reponse
- Bouton "Marquer pour relecture" pour revenir sur une question avant soumission
- Bouton "Soumettre" avec confirmation obligatoire ("Etes-vous sur ? Vous avez encore X min et Y questions non repondues")
- Sauvegarde automatique toutes les 30 secondes — en cas de coupure reseau, les reponses sont preservees localement et synchronisees a la reconnexion
- Alerte de deconnexion visible si la connexion est perdue, sans fermer l'examen

### 6.5 Mode Quiz d'Entrainement

Distinct des examens officiels, le professeur peut creer des quiz libres (devoirs maison, auto-evaluation):

- Pas de contrainte anti-triche stricte
- Plusieurs tentatives autorisees
- Score affiche immediatement avec les bonnes reponses et explications
- Non pris en compte dans la moyenne officielle (sauf si explicitement choisi)

## 7. Super Administrateur — Fonctionnalites Systeme

- Gestion des roles et permissions: creation de roles personnalises avec granularite fine (ex: agent scolarite avec acces aux documents uniquement)
- Gestion de l'annee academique: ouverture/fermeture d'un semestre, archivage des donnees, initialisation de la nouvelle annee
- Configuration de l'etablissement: nom, logo, couleurs de la plateforme (white-label partiel), informations legales pour les documents officiels
- Audit log: journal complet de toutes les actions sensibles sur la plateforme (qui a modifie quoi, quand)
- Gestion des integrations: passerelle SMS, serveur e-mail, stockage cloud
- Monitoring systeme: etat des serveurs, temps de reponse, utilisateurs connectes en temps reel
- Sauvegardes: declenchement manuel de sauvegardes, visualisation des sauvegardes automatiques

## 8. Architecture des Ecrans — Arborescence Complete

```text
ESGIS Campus
|
|-- [Public] Page de connexion / Mot de passe oublie
|
|-- [ETUDIANT]
|   |-- Tableau de bord
|   |-- Mes Cours
|   |   |-- Bibliotheque par matiere
|   |   `-- Recherche de ressources
|   |-- Mon Calendrier
|   |   |-- Vue semaine
|   |   |-- Vue mois
|   |   `-- Export / Synchronisation
|   |-- Mes Notes
|   |   |-- Notes du semestre en cours
|   |   |-- Historique (semestres precedents)
|   |   `-- Releve officiel
|   |-- Mes Examens
|   |   |-- Examens a venir
|   |   |-- Examen en cours (interface dediee)
|   |   `-- Resultats des examens passes
|   |-- Mes Documents
|   |   |-- Generer un certificat de scolarite
|   |   |-- Telecharger mes bulletins
|   |   |-- Attestations & autres documents
|   |   `-- Historique des documents generes
|   |-- Stages & Opportunites
|   |   |-- Liste des offres
|   |   |-- Detail d'une offre
|   |   `-- Mes candidatures
|   |-- Communication
|   |   |-- Messagerie
|   |   |-- Annonces
|   |   `-- Forums (par matiere)
|   `-- Mon Profil & Parametres
|
|-- [PROFESSEUR]
|   |-- Tableau de bord
|   |-- Mes Cours
|   |   |-- Depot de ressources
|   |   |-- Gestion de la bibliotheque
|   |   `-- Gestion des programmes / syllabus
|   |-- Gestion des Notes
|   |   |-- Saisie des notes (par matiere)
|   |   |-- Revue avant publication
|   |   `-- Demandes de correction
|   |-- Examens en Ligne
|   |   |-- Creer un examen
|   |   |-- Banque de questions
|   |   |-- Suivi en temps reel
|   |   `-- Correction & Resultats
|   |-- Mes Promotions
|   |   |-- Liste des etudiants
|   |   `-- Fiche individuelle etudiant
|   |-- Mon Calendrier
|   |-- Communication
|   |   |-- Messagerie
|   |   |-- Annonces ciblees
|   |   `-- Moderation des forums
|   `-- Mon Profil & Parametres
|
|-- [ADMINISTRATION]
|   |-- Tableau de bord analytique
|   |-- Gestion des Etudiants
|   |   |-- Liste & Recherche
|   |   |-- Dossier etudiant
|   |   |-- Creer / Importer des etudiants
|   |   `-- Gestion des statuts & paiements
|   |-- Gestion des Professeurs
|   |-- Structure Academique
|   |   |-- Filieres & Niveaux
|   |   |-- Matieres & Coefficients
|   |   `-- Maquettes pedagogiques
|   |-- Documents Officiels
|   |   |-- Templates de documents
|   |   |-- File d'attente des validations
|   |   `-- Generation en masse
|   |-- Calendrier Institutionnel
|   |-- Stages & Partenariats
|   |-- Communication Institutionnelle
|   `-- Rapports & Exports
|
`-- [SUPER ADMIN]
    |-- Gestion des roles
    |-- Configuration systeme
    |-- Audit log
    |-- Monitoring
    `-- Sauvegardes
```

## 9. Fonctionnalites Transversales Cles

### 9.1 Systeme de Notifications Multi-Canal

Chaque utilisateur recoit les alertes pertinentes via:

- Notification push (navigateur ou mobile)
- E-mail (resume quotidien ou alerte immediate selon la criticite)
- SMS (uniquement pour evenements critiques: examen dans 2h, compte suspendu)
- Bandeau dans la plateforme (pastille rouge sur l'icone concernee)

### 9.2 Application Mobile Native

L'ensemble des fonctionnalites est accessible via une application iOS et Android, avec en plus:

- Mode hors-ligne pour les cours telecharges
- Authentification biometrique
- Notifications push natives
- Scan du QR code pour verification de document

### 9.3 Accessibilite & Internationalisation

- Interface disponible en francais et anglais
- Respect des standards d'accessibilite WCAG 2.1 (contraste, navigation clavier, lecteurs d'ecran)
- Compatible avec les connexions a faible bande passante (compression des ressources, mode economique)

### 9.4 Securite des Donnees

- Chiffrement de toutes les donnees en transit (HTTPS/TLS) et au repos
- Authentification a deux facteurs (2FA) disponible pour tous les profils, obligatoire pour l'administration
- Sessions avec expiration automatique apres inactivite
- Journalisation de toutes les actions sensibles (connexions, modifications de notes, generation de documents)
- Conformite RGPD: droit d'acces, de rectification, politique de retention des donnees definie

## 10. Ce qui rend ESGIS Campus reellement pratique

Au-dela des fonctionnalites, voici les decisions de conception qui font la difference dans le quotidien:

### Pour les etudiants

Plus jamais de file d'attente a la scolarite pour un certificat de scolarite. Le document est disponible en 10 secondes, officiel et verifiable. Les notes sont accessibles des leur publication, pas apres une attente de 3 semaines.

### Pour les professeurs

Deposer un cours prend 60 secondes. Creer un examen QCM de 30 questions et le deployer a 200 etudiants, c'est moins d'une heure de travail. La correction des QCM est instantanee et automatique.

### Pour l'administration

Generer les bulletins de 500 etudiants a la fin du semestre prend quelques minutes au lieu de plusieurs jours. Chaque document produit est tracable et authentifiable en quelques secondes via QR code.

### Pour l'integrite academique

Chaque note, chaque modification, chaque document genere laisse une trace horodatee et nominative. Impossible de modifier une note sans validation croisee. Les examens en ligne sont plus difficiles a tricher qu'un papier photocopie.
