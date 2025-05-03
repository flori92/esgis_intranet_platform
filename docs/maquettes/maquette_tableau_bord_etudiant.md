# Maquette détaillée - Tableau de bord étudiant

## Description générale

Le tableau de bord étudiant est la page d'accueil de l'intranet pour les utilisateurs ayant le rôle "étudiant". Cette page présente une vue d'ensemble des informations importantes et des raccourcis vers les fonctionnalités principales.

## Éléments visuels clés

### Palette de couleurs
- **Couleur principale** : Bleu ESGIS (#003366)
- **Couleur d'accentuation** : Rouge ESGIS (#CC0000)
- **Fond principal** : Blanc (#FFFFFF)
- **Fond secondaire** : Gris clair (#F5F5F5)
- **Texte principal** : Noir (#212121)
- **Texte secondaire** : Gris foncé (#757575)

### Typographie
- **Police principale** : Montserrat
- **Taille de titre principal** : 24px (1.5rem)
- **Taille de sous-titre** : 18px (1.125rem)
- **Taille de texte standard** : 16px (1rem)

## Structure de la page

```
+-------------------------------------------------------+
| [Barre de navigation supérieure - Bleu ESGIS #003366] |
+-------------------------------------------------------+
|                                                       |
| +----------+  +-----------------------------------+   |
| |          |  |                                   |   |
| | MENU     |  | TABLEAU DE BORD                   |   |
| | LATÉRAL  |  | Bienvenue, [Nom de l'étudiant]    |   |
| | (Bleu    |  |                                   |   |
| | ESGIS)   |  | +------+  +------+  +------+      |   |
| |          |  | |Emploi|  |Notes |  |Cours |      |   |
| | - Accueil|  | |du    |  |récen.|  |à     |      |   |
| | - EDT    |  | |temps |  |      |  |venir |      |   |
| | - Cours  |  | +------+  +------+  +------+      |   |
| | - Notes  |  |                                   |   |
| | - Exams  |  | ACTUALITÉS                        |   |
| | - Docs   |  | +---------------------------+     |   |
| | - Stages |  | | [Image] Titre actualité   |     |   |
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
| [Pied de page - Gris clair #F5F5F5]                  |
+-------------------------------------------------------+
```

## Composants détaillés

### 1. En-tête de page

```
+-----------------------------------+
| TABLEAU DE BORD                   |
| Bienvenue, [Nom de l'étudiant]    |
+-----------------------------------+
```

- **Titre** : "TABLEAU DE BORD" en Montserrat, 24px, gras, couleur #003366
- **Sous-titre** : "Bienvenue, [Nom de l'étudiant]" en Montserrat, 16px, normal, couleur #757575
- **Espacement** : Marge inférieure de 24px (1.5rem)

### 2. Widgets d'information

```
+------+  +------+  +------+
|Emploi|  |Notes |  |Cours |
|du    |  |récen.|  |à     |
|temps |  |      |  |venir |
+------+  +------+  +------+
```

#### Widget "Emploi du temps du jour"
- **Conteneur** : Carte blanche avec ombre légère, bordure gauche de 4px en bleu ESGIS (#003366)
- **Titre** : "Aujourd'hui" avec icône de calendrier, Montserrat, 18px, semi-gras, couleur #003366
- **Contenu** : Liste des cours du jour avec heures, salles et professeurs
- **État vide** : Message "Aucun cours aujourd'hui" en gris
- **Action** : Bouton "Voir l'emploi du temps" en bas à droite

#### Widget "Notes récentes"
- **Conteneur** : Carte blanche avec ombre légère, bordure gauche de 4px en vert (#006633)
- **Titre** : "Notes récentes" avec icône de document, Montserrat, 18px, semi-gras, couleur #006633
- **Contenu** : Liste des 3 dernières notes avec matière, note et date
- **État vide** : Message "Aucune note récente" en gris
- **Action** : Bouton "Voir toutes les notes" en bas à droite

#### Widget "Cours à venir"
- **Conteneur** : Carte blanche avec ombre légère, bordure gauche de 4px en orange (#FF9900)
- **Titre** : "Examens à venir" avec icône d'école, Montserrat, 18px, semi-gras, couleur #FF9900
- **Contenu** : Liste des 2 prochains examens avec date, salle et durée
- **État vide** : Message "Aucun examen à venir" en gris
- **Action** : Bouton "Voir tous les examens" en bas à droite

### 3. Section Actualités

```
ACTUALITÉS
+---------------------------+
| [Image] Titre actualité   |
| Description courte...     |
+---------------------------+
```

- **Titre de section** : "ACTUALITÉS" en Montserrat, 20px, gras, couleur #003366
- **Conteneur** : Carte blanche avec ombre légère
- **Image** : Image d'illustration à gauche (ratio 16:9)
- **Titre d'actualité** : Montserrat, 18px, semi-gras, couleur #212121
- **Description** : Montserrat, 16px, normal, couleur #757575, tronquée avec "..."
- **Date** : Montserrat, 14px, normal, couleur #757575
- **Priorité** : Badge "Important" en rouge pour les actualités prioritaires
- **Action** : Clic sur la carte pour voir l'actualité complète

### 4. Section Événements

```
PROCHAINS ÉVÉNEMENTS
+---------------------------+
| [Date] Événement 1       |
| [Date] Événement 2       |
+---------------------------+
```

- **Titre de section** : "PROCHAINS ÉVÉNEMENTS" en Montserrat, 20px, gras, couleur #003366
- **Conteneur** : Carte blanche avec ombre légère
- **Date** : Format "JJ MMM" en Montserrat, 14px, semi-gras, couleur #003366
- **Titre d'événement** : Montserrat, 16px, normal, couleur #212121
- **Action** : Clic sur l'événement pour voir les détails

### 5. Accès rapides

```
+------+  +------+  +------+  +------+
|Docs  |  |EDT   |  |Notes |  |Cours |
|      |  |      |  |      |  |      |
+------+  +------+  +------+  +------+
```

- **Conteneur** : Cartes blanches avec ombre légère, transition au survol
- **Icône** : Icône centrée, taille 40px, couleur #003366
- **Titre** : Montserrat, 16px, semi-gras, couleur #212121, centré
- **Action** : Clic sur la carte pour accéder à la fonctionnalité

## Comportements interactifs

### Chargement des données
- Affichage de squelettes de chargement (Skeleton) pendant le chargement des données
- Message d'erreur en cas d'échec de chargement

### Responsive design
- **Desktop** : Affichage complet comme décrit ci-dessus
- **Tablette** : Widgets empilés sur 2 colonnes, menu latéral rétractable
- **Mobile** : Widgets empilés sur 1 colonne, menu latéral masqué avec bouton hamburger

### Animations
- Transition douce au survol des cartes (élévation légère)
- Animation de chargement pour les squelettes
- Transition douce pour l'ouverture/fermeture du menu latéral sur mobile

## Exemple de données

### Emploi du temps du jour
```json
[
  {
    "id": 1,
    "course": { "name": "Développement Web Avancé" },
    "start_time": "08:30:00",
    "end_time": "10:30:00",
    "room": "Salle 201",
    "professor": { "full_name": "Dr. Martin Dupont" }
  },
  {
    "id": 2,
    "course": { "name": "Bases de Données" },
    "start_time": "13:00:00",
    "end_time": "15:00:00",
    "room": "Labo Info 3",
    "professor": { "full_name": "Dr. Sophie Laurent" }
  }
]
```

### Notes récentes
```json
[
  {
    "id": 1,
    "course": { "name": "Algorithmes et Structures de Données" },
    "grade": 16.5,
    "max_grade": 20,
    "created_at": "2025-04-28T10:15:00"
  },
  {
    "id": 2,
    "course": { "name": "Réseaux Informatiques" },
    "grade": 14,
    "max_grade": 20,
    "created_at": "2025-04-25T16:30:00"
  }
]
```

### Examens à venir
```json
[
  {
    "id": 1,
    "course": { "name": "Développement Web Avancé" },
    "exam_date": "2025-05-15T09:00:00",
    "room": "Amphi A",
    "duration": 120
  },
  {
    "id": 2,
    "course": { "name": "Bases de Données" },
    "exam_date": "2025-05-20T14:00:00",
    "room": "Salle 201",
    "duration": 180
  }
]
```

---

Document préparé le 3 mai 2025
