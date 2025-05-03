# Maquettes des Interfaces Principales - Intranet ESGIS

Ce document présente les maquettes textuelles des principales interfaces de l'intranet étudiant ESGIS. Ces descriptions serviront de base pour la création des maquettes visuelles dans un outil comme Figma.

## 1. Interfaces communes

### 1.1 Page de connexion

```
+-------------------------------------------------------+
|                                                       |
|   +-------------------------------------------+       |
|   |                                           |       |
|   |  [Logo ESGIS]                             |       |
|   |                                           |       |
|   |  INTRANET ESGIS                           |       |
|   |                                           |       |
|   |  +-----------------------------------+    |       |
|   |  | Email                             |    |       |
|   |  +-----------------------------------+    |       |
|   |                                           |       |
|   |  +-----------------------------------+    |       |
|   |  | Mot de passe                      |    |       |
|   |  +-----------------------------------+    |       |
|   |                                           |       |
|   |  [Mot de passe oublié ?]                  |       |
|   |                                           |       |
|   |  +-----------------------------------+    |       |
|   |  |          SE CONNECTER             |    |       |
|   |  +-----------------------------------+    |       |
|   |                                           |       |
|   +-------------------------------------------+       |
|                                                       |
+-------------------------------------------------------+
```

**Éléments clés :**
- Logo ESGIS en haut
- Formulaire de connexion centré
- Champs pour email et mot de passe
- Lien "Mot de passe oublié"
- Bouton de connexion rouge ESGIS
- Fond avec motif subtil aux couleurs de l'ESGIS

### 1.2 Tableau de bord (Layout général)

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | TITRE DE LA SECTION               |   |
| | LATÉRAL  |  | Fil d'Ariane                      |   |
| |          |  |                                   |   |
| | - Item 1 |  | +------+  +------+  +------+      |   |
| | - Item 2 |  | | Card |  | Card |  | Card |      |   |
| | - Item 3 |  | +------+  +------+  +------+      |   |
| | - Item 4 |  |                                   |   |
| | - Item 5 |  | +---------------------------+     |   |
| |          |  | |                           |     |   |
| |          |  | |       Contenu principal   |     |   |
| |          |  | |                           |     |   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Barre de navigation supérieure avec logo, notifications et profil
- Menu latéral adapté au rôle de l'utilisateur
- Zone de contenu principal avec fil d'Ariane
- Cartes de résumé en haut (widgets)
- Pied de page avec copyright

## 2. Interfaces étudiant

### 2.1 Tableau de bord étudiant

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | TABLEAU DE BORD                   |   |
| | ÉTUDIANT |  | Accueil > Tableau de bord         |   |
| |          |  |                                   |   |
| | - Accueil|  | +------+  +------+  +------+      |   |
| | - EDT    |  | |Emploi|  |Notes |  |Cours |      |   |
| | - Cours  |  | |du    |  |récen.|  |à     |      |   |
| | - Notes  |  | |temps |  |      |  |venir |      |   |
| | - Exams  |  | +------+  +------+  +------+      |   |
| | - Docs   |  |                                   |   |
| | - Stages |  | ACTUALITÉS                        |   |
| |          |  | +---------------------------+     |   |
| |          |  | | [Image] Titre actualité   |     |   |
| |          |  | | Description courte...     |     |   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| |          |  | PROCHAINS ÉVÉNEMENTS             |   |
| |          |  | +---------------------------+     |   |
| |          |  | | [Date] Événement 1       |     |   |
| |          |  | | [Date] Événement 2       |     |   |
| |          |  | +---------------------------+     |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Widgets de résumé (emploi du temps du jour, dernières notes, prochains cours)
- Section actualités avec images
- Liste des prochains événements
- Menu latéral spécifique aux étudiants

### 2.2 Emploi du temps étudiant

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | EMPLOI DU TEMPS                   |   |
| | ÉTUDIANT |  | Accueil > Emploi du temps         |   |
| |          |  |                                   |   |
| | - Accueil|  | [Semaine précédente] Semaine 18   |   |
| | - EDT    |  | [Semaine actuelle]  03-09 mai 2025|   |
| | - Cours  |  | [Semaine suivante]                |   |
| | - Notes  |  |                                   |   |
| | - Exams  |  | +-------------------------------+ |   |
| | - Docs   |  | |    |  LUN  |  MAR  |  MER  |...|   |
| | - Stages |  | |----+-------+-------+-------+---|   |
| |          |  | | 8h | Cours | Cours |       |...|   |
| |          |  | |----+-------+-------+-------+---|   |
| |          |  | | 9h |       | Cours | Cours |...|   |
| |          |  | |----+-------+-------+-------+---|   |
| |          |  | | ...|  ...  |  ...  |  ...  |...|   |
| |          |  | +-------------------------------+ |   |
| |          |  |                                   |   |
| |          |  | [Télécharger PDF] [iCalendar]     |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Navigation entre semaines
- Vue hebdomadaire avec créneaux horaires
- Cours affichés dans des blocs colorés selon la matière
- Options pour télécharger l'emploi du temps

### 2.3 Espace notes et bulletins

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | NOTES ET BULLETINS                |   |
| | ÉTUDIANT |  | Accueil > Notes et bulletins      |   |
| |          |  |                                   |   |
| | - Accueil|  | [Onglet Notes] [Onglet Bulletins] |   |
| | - EDT    |  |                                   |   |
| | - Cours  |  | Semestre: [Dropdown S1/S2]        |   |
| | - Notes  |  | Année: [Dropdown 2024-2025]       |   |
| | - Exams  |  |                                   |   |
| | - Docs   |  | +---------------------------+     |   |
| | - Stages |  | | UE/Matière | Coef | Note  |     |   |
| |          |  | |------------+------+-------|     |   |
| |          |  | | Matière 1  | 3    | 15/20 |     |   |
| |          |  | | Matière 2  | 2    | 12/20 |     |   |
| |          |  | | Matière 3  | 4    | 14/20 |     |   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| |          |  | Moyenne générale: 14.2/20         |   |
| |          |  | Rang: 3/25                        |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Onglets pour naviguer entre notes et bulletins
- Filtres par semestre et année académique
- Tableau des notes avec coefficients
- Résumé des performances (moyenne, rang)
- Option pour télécharger le bulletin

## 3. Interfaces professeur

### 3.1 Tableau de bord professeur

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | TABLEAU DE BORD                   |   |
| | PROF.    |  | Accueil > Tableau de bord         |   |
| |          |  |                                   |   |
| | - Accueil|  | +------+  +------+  +------+      |   |
| | - EDT    |  | |Cours |  |Exams |  |Notes |      |   |
| | - Cours  |  | |du    |  |à     |  |à     |      |   |
| | - Notes  |  | |jour  |  |venir |  |saisir|      |   |
| | - Exams  |  | +------+  +------+  +------+      |   |
| | - Étudiants|  |                                 |   |
| | - Docs   |  | MES COURS                         |   |
| |          |  | +---------------------------+     |   |
| |          |  | | [Icon] Cours 1            |     |   |
| |          |  | | Niveau - X étudiants      |     |   |
| |          |  | +---------------------------+     |   |
| |          |  | | [Icon] Cours 2            |     |   |
| |          |  | | Niveau - X étudiants      |     |   |
| |          |  | +---------------------------+     |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Widgets de résumé (cours du jour, examens à venir, notes à saisir)
- Liste des cours enseignés avec accès rapide
- Menu latéral spécifique aux professeurs

### 3.2 Gestion des notes

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | GESTION DES NOTES                 |   |
| | PROF.    |  | Accueil > Notes > Saisie          |   |
| |          |  |                                   |   |
| | - Accueil|  | Cours: [Dropdown]                 |   |
| | - EDT    |  | Type: [CC/TP/Examen]              |   |
| | - Cours  |  | Date: [Datepicker]                |   |
| | - Notes  |  |                                   |   |
| | - Exams  |  | +---------------------------+     |   |
| | - Étudiants|  | | Étudiant | Note | Comment.|   |   |
| | - Docs   |  | |----------+------+----------|   |   |
| |          |  | | Nom 1    | [__] | [______] |   |   |
| |          |  | | Nom 2    | [__] | [______] |   |   |
| |          |  | | Nom 3    | [__] | [______] |   |   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| |          |  | [Import Excel] [Export Excel]     |   |
| |          |  |                                   |   |
| |          |  | [Enregistrer] [Publier]           |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Sélection du cours et du type d'évaluation
- Tableau de saisie des notes avec commentaires
- Options d'import/export Excel
- Boutons pour enregistrer (brouillon) ou publier (définitif)

### 3.3 Création d'examen

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | CRÉATION D'EXAMEN                 |   |
| | PROF.    |  | Accueil > Examens > Nouveau       |   |
| |          |  |                                   |   |
| | - Accueil|  | Titre: [_________________]        |   |
| | - EDT    |  | Cours: [Dropdown]                 |   |
| | - Cours  |  | Description: [_______________]    |   |
| | - Notes  |  | Date: [Datepicker] Durée: [___]min|   |
| | - Exams  |  |                                   |   |
| | - Étudiants|  | QUESTIONS                       |   |
| | - Docs   |  | +---------------------------+     |   |
| |          |  | | [+] Ajouter une question  |     |   |
| |          |  | |                           |     |   |
| |          |  | | Q1: [Type] [Texte]        |     |   |
| |          |  | | Réponses: [Options]       |     |   |
| |          |  | |                           |     |   |
| |          |  | | Q2: [Type] [Texte]        |     |   |
| |          |  | | Réponses: [Options]       |     |   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| |          |  | [Enregistrer] [Aperçu] [Publier]  |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Formulaire de configuration de l'examen
- Éditeur de questions avec différents types (QCM, texte, etc.)
- Options pour enregistrer, prévisualiser ou publier

## 4. Interfaces administratives

### 4.1 Tableau de bord administratif

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | TABLEAU DE BORD ADMIN             |   |
| | ADMIN    |  | Accueil > Tableau de bord         |   |
| |          |  |                                   |   |
| | - Accueil|  | +------+  +------+  +------+      |   |
| | - Utilisateurs| |Étud. |  |Prof. |  |Cours |    |   |
| | - Filières|  | |actifs|  |actifs|  |actifs|    |   |
| | - Cours  |  | |  125 |  |  15  |  |  42  |    |   |
| | - EDT    |  | +------+  +------+  +------+      |   |
| | - Docs   |  |                                   |   |
| | - Stages |  | STATISTIQUES                      |   |
| | - Paiements| | +---------------------------+     |   |
| | - Rapports| | |                           |     |   |
| |          |  | |      [Graphique]          |     |   |
| |          |  | |                           |     |   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| |          |  | ALERTES SYSTÈME                   |   |
| |          |  | +---------------------------+     |   |
| |          |  | | [!] Alerte 1              |     |   |
| |          |  | | [!] Alerte 2              |     |   |
| |          |  | +---------------------------+     |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Widgets de statistiques globales
- Graphiques de suivi des activités
- Alertes système
- Menu administratif complet

### 4.2 Gestion des utilisateurs

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | GESTION DES UTILISATEURS          |   |
| | ADMIN    |  | Accueil > Utilisateurs            |   |
| |          |  |                                   |   |
| | - Accueil|  | [Recherche___________] [Filtres]  |   |
| | - Utilisateurs| | [+ Nouvel utilisateur]        |   |
| | - Filières|  |                                  |   |
| | - Cours  |  | +---------------------------+     |   |
| | - EDT    |  | | Nom | Email | Rôle | Statut|    |   |
| | - Docs   |  | |-----+-------+------+-------|    |   |
| | - Stages |  | | Nom1| email1| Étud.| Actif |    |   |
| | - Paiements| | | Nom2| email2| Prof.| Actif |    |   |
| | - Rapports| | | Nom3| email3| Admin| Inactif|    |   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| |          |  | [< 1 2 3 ... >] 25 résultats      |   |
| |          |  |                                   |   |
| |          |  | [Export CSV] [Import CSV]         |   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Barre de recherche et filtres
- Tableau des utilisateurs avec actions rapides
- Pagination
- Options d'import/export
- Bouton pour ajouter un nouvel utilisateur

### 4.3 Gestion des emplois du temps

```
+-------------------------------------------------------+
| [Logo] INTRANET ESGIS                [Notif] [Profil] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | GESTION DES EMPLOIS DU TEMPS      |   |
| | ADMIN    |  | Accueil > Emplois du temps        |   |
| |          |  |                                   |   |
| | - Accueil|  | Filière: [Dropdown]               |   |
| | - Utilisateurs| | Niveau: [Dropdown]            |   |
| | - Filières|  | Semaine: [Datepicker]            |   |
| | - Cours  |  |                                   |   |
| | - EDT    |  | +---------------------------+     |   |
| | - Docs   |  | |    |  LUN  |  MAR  |  MER  |...|   |
| | - Stages |  | |----+-------+-------+-------+---|   |
| | - Paiements| | | 8h | [+]   | [+]   | [+]   |...|   |
| | - Rapports| | |----+-------+-------+-------+---|   |
| |          |  | | 9h | [+]   | [+]   | [+]   |...|   |
| |          |  | |----+-------+-------+-------+---|   |
| |          |  | | ...|  ...  |  ...  |  ...  |...|   |
| |          |  | +---------------------------+     |   |
| |          |  |                                   |   |
| |          |  | [Enregistrer] [Publier] [Notifier]|   |
| +----------+  +-----------------------------------+   |
|                                                       |
| © 2025 ESGIS - Tous droits réservés                   |
+-------------------------------------------------------+
```

**Éléments clés :**
- Sélection de filière, niveau et semaine
- Grille interactive avec boutons [+] pour ajouter des cours
- Options pour enregistrer, publier et notifier les utilisateurs

## 5. Interfaces modales et formulaires

### 5.1 Ajout d'un cours à l'emploi du temps

```
+-------------------------------------------------------+
|                                                       |
|  +-------------------------------------------+        |
|  |                                           |        |
|  | AJOUTER UN COURS                      [X] |        |
|  |                                           |        |
|  | Cours: [Dropdown___________________]      |        |
|  |                                           |        |
|  | Professeur: [Dropdown_______________]     |        |
|  |                                           |        |
|  | Salle: [___________________________]      |        |
|  |                                           |        |
|  | Date: [Datepicker]                        |        |
|  |                                           |        |
|  | Heure début: [__:__]  Heure fin: [__:__]  |        |
|  |                                           |        |
|  | Récurrence:                               |        |
|  | ( ) Unique  ( ) Hebdomadaire              |        |
|  | ( ) Jusqu'au [Datepicker]                 |        |
|  |                                           |        |
|  | [    Annuler    ]  [    Ajouter    ]      |        |
|  |                                           |        |
|  +-------------------------------------------+        |
|                                                       |
+-------------------------------------------------------+
```

### 5.2 Génération de document administratif

```
+-------------------------------------------------------+
|                                                       |
|  +-------------------------------------------+        |
|  |                                           |        |
|  | GÉNÉRER UN DOCUMENT                   [X] |        |
|  |                                           |        |
|  | Type: [Dropdown___________________]       |        |
|  | ○ Certificat de scolarité                 |        |
|  | ○ Attestation de réussite                 |        |
|  | ○ Relevé de notes                         |        |
|  |                                           |        |
|  | Étudiant: [Dropdown/Recherche_______]     |        |
|  |                                           |        |
|  | Année académique: [Dropdown_______]       |        |
|  |                                           |        |
|  | Options supplémentaires:                  |        |
|  | [ ] Inclure le cachet numérique           |        |
|  | [ ] Ajouter signature électronique        |        |
|  |                                           |        |
|  | [    Annuler    ]  [    Générer    ]      |        |
|  |                                           |        |
|  +-------------------------------------------+        |
|                                                       |
+-------------------------------------------------------+
```

### 5.3 Notification système

```
+-------------------------------------------------------+
|                                                       |
|  +-------------------------------------------+        |
|  |                                           |        |
|  | ENVOYER UNE NOTIFICATION              [X] |        |
|  |                                           |        |
|  | Destinataires:                            |        |
|  | ○ Tous les utilisateurs                   |        |
|  | ○ Tous les étudiants                      |        |
|  | ○ Tous les professeurs                    |        |
|  | ○ Filière spécifique [Dropdown_____]      |        |
|  |                                           |        |
|  | Titre: [___________________________]      |        |
|  |                                           |        |
|  | Message:                                  |        |
|  | [                                 ]       |        |
|  | [                                 ]       |        |
|  | [                                 ]       |        |
|  |                                           |        |
|  | Priorité: ○ Normale  ○ Importante         |        |
|  |                                           |        |
|  | [ ] Envoyer également par email           |        |
|  |                                           |        |
|  | [    Annuler    ]  [    Envoyer    ]      |        |
|  |                                           |        |
|  +-------------------------------------------+        |
|                                                       |
+-------------------------------------------------------+
```

---

Document préparé le 3 mai 2025
