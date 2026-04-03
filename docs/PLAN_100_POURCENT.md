# Plan 100% — Roadmap Complète ESGIS Campus

**Objectif:** Fermer tous les verrous et atteindre 100% du projet.
**Date de départ:** 2026-04-03 23h45
**Phases:** 5 (Phase 0 ≈ 95%, Phase 1 ≈ 96%, Phase 2 ≈ 70%, Phase 3-5 ≈ 0%)

---

## 📊 À FAIRE — DÉCOMPOSITION COMPLÈTE

### PHASE 2 — Professeur (Fermeture des 2 verrous)

#### ✅ VERROU 1: Création d'Examen Complète
**État:** Codé dans ExamFormPage.jsx, besoin validation
**Cas d'usage:** Professeur crée exam QCM+VF+Réponse+Dissertation → publie → étudiants voient

**Tests manuels requis:**
```
1. Créer exam avec 10 questions (1 QCM, 1 VF, 1 courte, 1 diss)
2. Définer durée (90 min), total points (20), visibilité
3. Publier (status → published)
4. Vérifier accès étudiant en lecture seule
5. Vérifier import depuis question_bank
```

**Fichiers critiques:**
- src/pages/professor/exams/ExamFormPage.jsx
- src/pages/exams/components/ExamQuestions.jsx
- src/api/exams.js

**Validation:** Pass/Fail (P/F) — test manuel requis

---

#### ✅ VERROU 2: Correction Manuelle/Automatique
**État:** API prête, runtime corrigé, besoin tests end-to-end
**Cas d'usage:** Étudiant soumis copie → Professeur note → Étudiant notifié

**Tests manuels requis:**
```
1. Prendre exam complet (étudiant) 
2. Attendre fin (ou forcer submitted)
3. Accéder GradingPage depuis ExamsListPage
4. Noter chaque question (auto pour QCM, manuel pour Dissertation)
5. Ajouter feedback général
6. Enregistrer → vérifié dans exam_results.score
7. Étudiant reçoit notification
8. Étudiant voit note dans ExamResultsPage
```

**Fichiers critiques:**
- src/pages/professor/exams/ExamGradingPage.jsx
- src/pages/professor/exams/components/GradeQuestionItem.jsx
- src/api/exams.js (gradeExam, getExamAttempts)

**Validation:** Pass/Fail (P/F) — test manuel requis

---

### PHASE 1 — Étudiant (Complétion des 4%)

#### [ITEM 1.1] Relève de Notes Officiel PDF
**État:** Non fait
**Logique:** Comme certificat mais rapport semi-annuel des notes

**Fichiers à créer:**
- src/pages/student/TranscriptPage.jsx (nouvelle page)
- Ajouter route dans StudentRoutes.jsx

**Dépendances:** grades, student_courses, courses

**Durée:** 2h

---

#### [ITEM 1.2] Bulletin Semestriel Officiel
**État:** Partiellement fait (GenerateurBulletinsPage)
**Complément:** Accès étudiant autonome à son bulletin (pas admin seulement)

**Fichiers:** src/pages/student/ReportCardPage.jsx

**Durée:** 1h

---

#### [ITEM 1.3] Profil et Préférences
**État:** ProfileSettingsPage existe à moitié
**Complément:** Langue, notifications, fuseau horaire

**Fichiers:** src/pages/shared/ProfileSettingsPage.jsx

**Durée:** 1h

---

#### [ITEM 1.4] Bibliothèque Pédagogique Complète
**État:** CoursesPage existe mais incomplet
**Complément:** Statuts lecture/téléchargement persistés par utilisateur

**Fichiers:** src/api/courses.js + src/pages/student/CoursesPage.jsx

**Durée:** 1h

---

### PHASE 3 — Administration (15 items)

#### [ITEM 3.1] Dossier Étudiant Numérique
**État:** Non fait
**Page:** AdminStudentDetailsPage.jsx (déjà existe)
**Logique:** Dashboard admin centralisant identité + inscriptions + notes + documents + paiements par étudiant

**Nouvelles dépendances:**
- Afficher profil complet (profiles, students)
- Inscrire aux cours (student_courses)
- Voir notes publiées (grades, exam_results)
- Voir documents générés (generated_documents)
- Voir paiements (payments, payment_records)
- Action rapide: envoyer message, suspendre compte

**Fichiers:** src/api/admin.js + src/pages/admin/students/StudentDetailsPage.jsx

**Durée:** 3h

---

#### [ITEM 3.2] Import Massif d'Étudiants (CSV)
**État:** Non fait
**Logique:** Upload CSV → validation → création en masse → envoi credentials

**Nouvelles dépendances:**
- Créer profiles + students
- Générer mots de passe temporaires
- Envoyer emails (NotificationService)

**Fichiers:** Nouvelle page AdminStudentImportPage.jsx

**Durée:** 4h

---

#### [ITEM 3.3] Activation/Suspension Comptes
**État:** Partiellement (UserManagementPage existe)
**Complément:** Toggle is_active + suspendre sessions + notifier utilisateur

**Fichiers:** src/pages/admin/UserManagementPage.jsx + src/api/users.js

**Durée:** 2h

---

#### [ITEM 3.4] Gestion Complète Professeurs
**État:** ProfessorRolesPage existe (rôles)
**Complément:** CRUD complet professeurs: créer, modifier, assigner cours, voir charges

**Fichiers:** Nouvelle page AdminProfessorsPage.jsx + src/api/admin.js

**Durée:** 3h

---

#### [ITEM 3.5-3.7] Filières, Niveaux, Semestres, Maquettes + Matières, Coeff, Crédits
**État:** Structures existent (courses, departments)
**Complément:** CRUD admin dédié + validation maquettes

**Fichiers:** AdminDepartmentsPage.jsx + AdminCoursesPage.jsx (étendre)

**Durée:** 4h

---

#### [ITEM 3.8] Templates Documents Officiels
**État:** document_templates table existe
**Complément:** Interface admin pour CRUD + preview

**Fichiers:** Nouvelle page AdminDocumentTemplatesPage.jsx

**Durée:** 2h

---

#### [ITEM 3.9] File d'Attente de Validation
**État:** Non fait (concept: demandes en attente — correction, documents, etc.)
**Logique:** Dashboard montrant toutes les demandes non traitées

**Fichiers:** Nouvelle page AdminValidationQueuePage.jsx

**Durée:** 2h

---

#### [ITEM 3.10] Génération en Masse de Bulletins
**État:** BulkBulletinPage existe
**Complément:** Trigger + planification automatique (chaque fin de semestre)

**Fichiers:** Étendre BulkBulletinPage.jsx

**Durée:** 2h

---

#### [ITEM 3.11] Dépôt Manuel Documents Dossier Étudiant
**État:** StudentDetailsPage devrait supporter
**Complément:** Upload fichiers → enregistrer dans generated_documents ou documents

**Durée:** 1h

---

#### [ITEM 3.12] Offres de Stages et Partenaires
**État:** PartnersPage + StagesPage existent
**Complément:** Admin gère les offres (publish/archive), partenaires (CRUD)

**Fichiers:** AdminStagesPage.jsx + AdminPartnersPage.jsx (ou étendre)

**Durée:** 3h

---

#### [ITEM 3.13] Calendrier Institutionnel
**État:** CalendarManagerPage existe
**Complément:** Admin crée + modifie événements institutionnels (jours fériés, congés, etc.)

**Durée:** 1h (déjà fait)

---

#### [ITEM 3.14] Communication Institutionnelle
**État:** AnnouncementsPage existe
**Complément:** Admin crée annonces ciblées par filière/niveau/rôle

**Durée:** 1h (déjà fait)

---

#### [ITEM 3.15] Rapports et Exports Fiables
**État:** ReportsPage existe
**Complément:** Graphes + export CSV/PDF (effectifs, moyennes, taux réussite)

**Durée:** 2h (partiellement)

---

#### [ITEM 3.16] Paiements et Reçus
**État:** PaymentsPage existe
**Complément:** Enregistrer versements + générer reçus PDF

**Durée:** 2h (partiellement)

---

### PHASE 4 — Sécurité

#### [ITEM 4.1] QR Verification Publique Docs
**État:** VerifyDocumentPage + DocumentQRService existent
**Durée:** 0h (déjà fait)

---

#### [ITEM 4.2] Historique Modifications Notes
**État:** Non fait
**Table:** audit_log (existe)
**Logique:** Tracker chaque maj de grades

**Durée:** 2h

---

#### [ITEM 4.3] Audit Log Transverse
**État:** AuditLogPage existe
**Complément:** Logger toutes les actions critiques (login, grades, suspensions)

**Durée:** 2h (partiellement)

---

#### [ITEM 4.4] OTP Verification Avant Examen
**État:** TwoFactorAuth existe
**Complément:** Forcer OTP au lancement d'examen

**Durée:** 1h

---

#### [ITEM 4.5] 2FA Administration
**État:** Existe
**Durée:** 0h (déjà fait)

---

#### [ITEM 4.6-4.8] Anti-Triche Renforcé + Rapport Intégrité + Retention RGPD
**État:** AntiCheatService existe
**Complément:** Améliorer lockdown + générer rapports + politiques retention

**Durée:** 3h

---

### PHASE 5 — Extensions

#### [ITEM 5.1] Super Administrateur
**État:** Rôles existent
**Complément:** Interface dédiée + permissions granulaires

**Durée:** 2h

---

#### [ITEM 5.2-5.3] Notifications Multi-Canal + App Mobile
**État:** Service existe mais notifications SMS/Email partial
**Complément:** Intégrer SMS (Twilio) + Push navigateur

**Durée:** 4h (multi-canal) + 8h (mobile — hors scope pour MVP)

---

#### [ITEM 5.4] iCal / Sync Agenda
**État:** Non fait
**Logique:** Étudiant exporte calendrier (emploi du temps + exams)

**Durée:** 2h

---

#### [ITEM 5.5] Forums par Matière
**État:** ForumPage existe
**Durée:** 1h (déjà fait)

---

#### [ITEM 5.6] Monitoring Système  
**État:** Non fait
**Logique:** Dashboard admin montrant uptime, requêtes/sec, erreurs

**Durée:** 3h

---

#### [ITEM 5.7] Sauvegardes Operables depuis Interface
**État:** Non fait
**Logique:** Admin peut déclencher backup ou restore (intégration Supabase)

**Durée:** 2h

---

## 📈 STRATÉGIE 100%

### Étape 1: Fermer Phase 2 (CRITIQUE)
- Verrou 1: Validation création d'examen (1h tests)
- Verrou 2: Validation correction (2h tests)
- **Subtotal:** 3h

### Étape 2: Compléter Phase 1
- 4 items simples: TranscriptPage, ReportCard, Profile, CoursesPage
- **Subtotal:** 5h

### Étape 3: Implémenter Phase 3
- 16 items (admin workflows)
- **Subtotal:** 35h

### Étape 4: Implémenter Phase 4
- 8 items (sécurité + audit)
- **Subtotal:** 10h

### Étape 5: Implémenter Phase 5
- 7 items (extensions)
- **Subtotal:** 15h

### **TOTAL ESTIMÉ: ~68 heures**

---

## 🎯 PRIORITÉ RÉALISTE POUR 100% EN 7 JOURS

**Étapes à faire:** (par jour)

1. **J1 (Fermeture P2):** Tests + fixes Verrous 1&2 → 3h
2. **J2-J3 (Phase 1 + P3 core):** TranscriptPage, Dossier Étudiant, Import Massif → 12h
3. **J4-J5 (Phase 3):** Admin CRUD (Prof, Depts, Matieres) → 15h
4. **J6 (Phase 4):** Audit + Sécurité → 8h
5. **J7 (Finition):** Extensions mineures + tests complets → 5h

**Alternative compact:** Focus Phase 2+3 seulement (55h) → 80% en 4 jours

---

## ⚙️ PROCHAINE ACTION

**Priorité #1:** Valider les verrous Phase 2
1. Lancer test examen complet (étudiant)
2. Corriger en professeur
3. Valider notification
4. Si OK → fermer Phase 2

**Priorité #2:** Implémenter Phase 3 MVP (3 items essentiels)
- Dossier Étudiant Numérique
- Import Massif Étudiants
- Gestion Professeurs

---

## 📝 TRACKING

Utilisez ce fichier pour tracker chaque item:

```
✅ FAIT   — Complètement implémenté + testé
🔄 EN COURS — Travail en progress
⏳ À FAIRE   — Prévu mais pas commencé
❌ BLOQUÉ   — Attend une dépendance
```

**Mise à jour quotidienne requise.**

