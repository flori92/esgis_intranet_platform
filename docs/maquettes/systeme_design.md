# Système de Design - Intranet ESGIS

Ce document définit les principes de design, la palette de couleurs, la typographie et les composants UI qui seront utilisés pour l'intranet étudiant ESGIS.

## 1. Principes de design

### 1.1 Simplicité et clarté
- Interfaces épurées et intuitives
- Hiérarchie visuelle claire
- Réduction de la charge cognitive

### 1.2 Cohérence
- Éléments d'interface cohérents sur toutes les pages
- Comportements prévisibles des interactions
- Terminologie uniforme

### 1.3 Accessibilité
- Conformité WCAG 2.1 niveau AA
- Contraste suffisant pour la lisibilité
- Navigation possible au clavier
- Compatibilité avec les lecteurs d'écran

### 1.4 Responsive design
- Adaptation à tous les appareils (desktop, tablette, mobile)
- Approche "mobile-first" pour les interfaces critiques
- Expérience utilisateur optimisée sur chaque format

## 2. Palette de couleurs

### 2.1 Couleurs principales
- **Bleu ESGIS** : #003366 (couleur principale de la marque)
- **Rouge ESGIS** : #CC0000 (couleur d'accentuation)
- **Blanc** : #FFFFFF (fond principal)
- **Noir** : #212121 (texte principal)

### 2.2 Couleurs secondaires
- **Gris clair** : #F5F5F5 (fond secondaire)
- **Gris moyen** : #E0E0E0 (bordures, séparateurs)
- **Gris foncé** : #757575 (texte secondaire)

### 2.3 Couleurs d'accentuation
- **Bleu clair** : #0066CC (liens, boutons secondaires)
- **Vert** : #006633 (succès, validation)
- **Orange** : #FF9900 (avertissement)
- **Rouge** : #CC0000 (erreur, alerte)

### 2.4 Couleurs contextuelles
- **Étudiant** : #0066CC (bleu)
- **Professeur** : #006633 (vert)
- **Administration** : #003366 (bleu ESGIS)

## 3. Typographie

### 3.1 Famille de polices
- **Principale** : Montserrat (sans-serif) pour tous les textes
- **Monospace** : Roboto Mono (pour code, données tabulaires)

### 3.2 Tailles de police
- **H1** : 32px / 2rem (titres de page)
- **H2** : 24px / 1.5rem (sections principales)
- **H3** : 20px / 1.25rem (sous-sections)
- **H4** : 18px / 1.125rem (titres de cartes, widgets)
- **Corps** : 16px / 1rem (texte standard)
- **Petit** : 14px / 0.875rem (légendes, notes)
- **Très petit** : 12px / 0.75rem (mentions légales, crédits)

### 3.3 Poids de police
- **Normal** : 400
- **Semi-gras** : 600 (sous-titres, emphase)
- **Gras** : 700 (titres, boutons)

## 4. Composants UI

### 4.1 Navigation
- **Barre de navigation principale** : fixe en haut, adaptative selon le rôle, fond bleu ESGIS (#003366)
- **Menu latéral** : rétractable, navigation contextuelle, fond blanc avec accents bleu ESGIS
- **Fil d'Ariane** : pour la navigation hiérarchique
- **Tabs** : pour la navigation entre sections liées

### 4.2 Conteneurs
- **Cartes** : conteneurs avec ombre portée légère, coins arrondis (8px)
- **Panneaux** : sections de contenu avec bordures subtiles
- **Modales** : pour les actions focalisées et confirmations
- **Accordéons** : pour le contenu extensible

### 4.3 Formulaires
- **Champs de texte** : style Material Design avec animation de focus
- **Boutons** : primaires (bleu ESGIS), secondaires (rouge ESGIS), tertiaires (gris)
- **Sélecteurs** : dropdowns, radios, checkboxes avec style personnalisé
- **Validation** : feedback visuel immédiat, messages d'erreur explicites

### 4.4 Données
- **Tableaux** : lignes alternées, tri, filtrage
- **Listes** : avec icônes contextuelles
- **Graphiques** : visualisations de données avec palette cohérente
- **Badges** : indicateurs visuels d'état ou de catégorie

### 4.5 Feedback
- **Toasts** : notifications temporaires non bloquantes
- **Alertes** : messages contextuels (succès, info, avertissement, erreur)
- **Loaders** : indicateurs de chargement cohérents
- **États vides** : illustrations et messages pour les sections sans données

### 4.6 Icônes
- **Système** : Material Icons (cohérence avec Material Design)
- **Taille** : 24px standard, 18px pour contextes denses
- **Style** : ligne fine, remplissage pour états actifs

## 5. Espacement et grille

### 5.1 Système d'espacement
- Base de 8px (0.5rem)
- **4px (0.25rem)** : espacement minimal (entre icônes et texte)
- **8px (0.5rem)** : espacement petit (padding interne des éléments)
- **16px (1rem)** : espacement standard (entre éléments liés)
- **24px (1.5rem)** : espacement moyen (entre sections)
- **32px (2rem)** : espacement large (entre blocs majeurs)
- **48px (3rem)** : espacement très large (entre sections principales)

### 5.2 Grille responsive
- **Desktop** : 12 colonnes, gouttière de 24px
- **Tablette** : 8 colonnes, gouttière de 16px
- **Mobile** : 4 colonnes, gouttière de 8px
- Points de rupture : 600px, 960px, 1280px

## 6. Animations et transitions

### 6.1 Principes
- Subtiles et fonctionnelles, jamais décoratives
- Durée courte (150-300ms)
- Courbe d'accélération naturelle (ease-out)

### 6.2 Types d'animations
- **Fade** : apparition/disparition progressive
- **Slide** : déplacement latéral ou vertical
- **Scale** : agrandissement/réduction
- **Feedback** : réaction au clic, hover, focus

## 7. Assets et ressources

### 7.1 Logo et marque
- Logo ESGIS en version complète et icône
- Variantes : couleur, monochrome, inversé
- Zone de protection : espace minimal autour du logo

### 7.2 Illustrations
- Style cohérent, ligne fine, palette limitée
- Illustrations contextuelles pour les états vides
- Icônes personnalisées pour les fonctionnalités spécifiques

### 7.3 Images
- Photos de haute qualité pour les bannières et profils
- Ratio 16:9 pour les bannières
- Ratio 1:1 pour les avatars (cercle)

---

Document mis à jour le 3 mai 2025
