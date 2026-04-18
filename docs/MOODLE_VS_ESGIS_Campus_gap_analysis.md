# Moodle vs ESGIS Campus

## Synthese

Moodle est avant tout un LMS tres mature, optimise pour la gestion pedagogique profonde: structuration des cours, activites d apprentissage, suivi de completion, competences, devoirs, integrations standards et extensibilite par plugins.

ESGIS Campus couvre deja mieux que Moodle certains besoins campus et administratifs tres concrets:

- documents officiels avec verification QR
- workflows administratifs et guichet
- paiements et suivi de scolarite
- stages, partenaires et opportunites
- securisation des examens avec anti-triche
- segregation forte par profils ESGIS

La meilleure strategie n est donc pas de "copier Moodle", mais d absorber ses forces LMS sans perdre l avantage operationnel d ESGIS.

## Ce que Moodle fait mieux aujourd hui

### 1. Pedagogie structuree dans le temps

Moodle propose un vrai suivi de progression pedagogique:

- completion d activites
- completion de cours
- prerequis entre cours
- plans d apprentissage
- competences rattachees aux cours et activites

Dans ESGIS, les briques techniques existent partiellement (`competencies`, `learning_paths`, `student_path_progress`, `student_performance_analytics`) mais elles etaient peu visibles dans l interface.

### 2. Evaluation hors examens

Moodle ne se limite pas au quiz:

- devoirs a rendre
- feedback inline
- rubrics
- workflows de notation
- evaluation par pairs

ESGIS est fort sur l examen securise, mais moins complet sur les travaux fil rouge, remises de devoirs et evaluation formative.

### 3. Ecosysteme d activites pedagogiques

Moodle fournit nativement ou via plugins:

- forums pedagogiques
- wiki
- glossaire
- atelier peer review
- lecons
- SCORM / H5P / LTI

ESGIS a la messagerie, les annonces et les forums, mais il manque encore une couche d activites apprentissage reutilisables.

### 4. Interoperabilite et extensibilite

Moodle est concu comme une plateforme extensible:

- architecture plugin
- types de plugins multiples
- SCORM
- LTI
- ecosysteme d integrations

ESGIS est plus focalise, donc plus simple, mais moins extensible pour brancher des outils tiers ou ouvrir un marche d extensions internes.

### 5. Learning analytics institutionnels

Moodle va plus loin sur:

- modeles predictifs
- etudiants a risque
- logs pedagogiques exploitables
- suivi par cohortes et competences

ESGIS possede deja des tables d analytics et d alertes, mais elles doivent etre davantage exposees et exploitees dans les ecrans de suivi.

## Ce qu ESGIS fait deja mieux que Moodle

- meilleure couverture administrative campus
- documents officiels verifies publiquement
- experience ciblee par role ESGIS
- module examen plus securise que le quiz standard Moodle
- presence d un vrai cycle stages / partenaires / employabilite
- meilleure convergence entre vie academique et operations campus

## Priorites produit recommandees

### P1. Consolidation LMS

1. Parcours & progression visible pour l etudiant et le professeur
2. Competences rattachees aux cours, notes et stages
3. alertes precoces et suivi des etudiants a risque
4. completion de ressources, modules et cours

### P2. Evaluation continue

1. devoirs avec remise de fichier/texte
2. rubrics et baremes reutilisables
3. feedback enseignant centralise
4. peer review exploitable

### P3. Activites pedagogiques

1. lecons interactives
2. contenus H5P / SCORM
3. wiki / glossaire / atelier
4. restrictions d acces par prerequis

### P4. Plateforme extensible

1. connecteurs LTI sortants/entrants
2. architecture de modules ESGIS
3. configuration fonctionnelle par campus / departement

## Amelioration implementee dans ce chantier

Ajout d un premier module etudiant `Parcours & Progression` expose dans l interface:

- visualisation des parcours d apprentissage
- progression agregee par parcours
- competences acquises par categorie
- alertes academiques
- analytics de performance par cours

Cette evolution rapproche ESGIS des points forts structurels de Moodle, tout en restant dans la logique produit campus ESGIS.

Ajout egalement d un premier module `Devoirs & Remises` pour professeur et etudiant:

- creation de devoirs par cours
- baremes reutilisables
- remises texte / fichier
- suivi des soumissions et correction enseignant
- consultation de la note et du feedback cote etudiant

Cette brique couvre une faiblesse historique d ESGIS face a Moodle sur l evaluation continue, tout en s integrant au modele campus existant.
