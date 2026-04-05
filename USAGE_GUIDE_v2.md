# 🎓 Manuel d'Utilisation Complet - 18 Relations v2 Enhanced

## Table des Matières
1. [Installation Rapide](#installation-rapide)
2. [Services v2 Avancés](#services-v2-avancés)
3. [Hooks v2 Optimisés](#hooks-v2-optimisés)
4. [Composants React](#composants-react)
5. [Gestion d'Erreurs](#gestion-derreurs)
6. [Exemples de Code](#exemples-de-code)
7. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Installation Rapide

### 1. Importer depuis le Central Index

```javascript
import {
  // Services v2
  StudentGroupsService,
  StudentAlertsService,
  InternshipService,
  CompetenciesService,
  ProfessorDashboardService,
  
  // Hooks v2
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline,
  useCompetencies,
  useProfessorDashboard,
  useAsync,
  useCache,
  
  // Composants prêts
  StudentGroupsManager,
  StudentAlertsPanel,
  InternshipBoard
} from '@/services/18Relations.index'
```

### 2. Configuration Supabase (Automatique)

```javascript
import { getSupabaseClient, testConnection } from '@/config/supabase.config'

// Test connexion au démarrage
const testSupabase = async () => {
  try {
    const isConnected = await testConnection()
    console.log('✅ Supabase connected:', isConnected)
  } catch (error) {
    console.error('❌ Connection failed:', error)
  }
}
```

---

## Services v2 Avancés

### StudentGroupsService

**Créer un groupe TP:**
```javascript
const StudentGroupsService = require('@/services/18Relations.index').StudentGroupsService

async function createTPGroup() {
  try {
    const group = await StudentGroupsService.createGroup({
      name: 'TP Mathématiques - Groupe A',
      course_id: 'course-uuid-here',
      professor_id: 'professor-uuid-here',
      max_students: 30,
      room: 'Salle 101'
    })
    console.log('✅ Groupe créé:', group)
  } catch (error) {
    console.error('❌ Erreur création:', error.message)
  }
}
```

**Récupérer les groupes d'un professeur:**
```javascript
async function getProfessorGroups() {
  try {
    const groups = await StudentGroupsService.getGroupsByProfessor(
      'professor-uuid-here'
    )
    console.log('📊 Groupes:', groups)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

**Ajouter un étudiant au groupe:**
```javascript
async function addStudentToGroup() {
  try {
    const result = await StudentGroupsService.addStudentToGroup(
      'group-uuid-here',
      'student-uuid-here'
    )
    console.log('✅ Étudiant ajouté')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

### StudentAlertsService

**Créer une alerte:**
```javascript
async function createAlert() {
  try {
    const alert = await StudentAlertsService.createAlert({
      student_id: 'student-uuid-here',
      alert_type: 'attendance',
      message: 'Présence insuffisante au cours',
      severity: 'high',
      is_resolved: false
    })
    console.log('🚨 Alerte créée')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

**Récupérer les alertes non résolues:**
```javascript
async function getUnresolvedAlerts() {
  try {
    const alerts = await StudentAlertsService.getAlerts(
      'student-uuid-here'
    )
    const unresolved = alerts.filter(a => !a.is_resolved)
    console.log('⚠️ Alertes non résolues:', unresolved.length)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

**Marquer une alerte comme résolue:**
```javascript
async function resolveAlert() {
  try {
    await StudentAlertsService.resolveAlert('alert-uuid-here')
    console.log('✅ Alerte marquée comme résolue')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

### InternshipService

**Créer une offre de stage:**
```javascript
async function createInternshipOffer() {
  try {
    const offer = await InternshipService.createOffer({
      title: 'Développeur Full-Stack - Été 2026',
      company_id: 'company-uuid-here',
      description: 'Rejoins notre équipe pour apprendre...',
      duration_weeks: 12,
      location: 'Paris, France',
      required_skills: ['JavaScript', 'React', 'Node.js']
    })
    console.log('🌟 Offre créée:', offer.id)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

**Postuler à une offre:**
```javascript
async function applyForInternship() {
  try {
    await InternshipService.applyForInternship(
      'offer-uuid-here',
      'student-uuid-here',
      {
        motivation_letter: 'Je suis intéressé par...',
        cv_url: 'https://example.com/cv.pdf'
      }
    )
    console.log('📤 Candidature envoyée')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

**Récupérer les offres disponibles:**
```javascript
async function getInternshipOffers() {
  try {
    const offers = await InternshipService.getOffers()
    console.log(`💼 ${offers.length} offres disponibles`)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

### CompetenciesService

**Ajouter une compétence:**
```javascript
async function addStudentCompetency() {
  try {
    const competency = await CompetenciesService.addCompetency({
      student_id: 'student-uuid-here',
      name: 'JavaScript ES6+',
      category: 'programming',
      level: 'advanced',
      verified: false
    })
    console.log('📚 Compétence ajoutée')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

**Récupérer les compétences filtrées:**
```javascript
async function getCompetencies() {
  try {
    // Par catégorie
    const programmingSkills = await CompetenciesService.getCompetenciesByStudent(
      'student-uuid-here',
      'programming'
    )
    console.log('🎯 Compétences programming:', programmingSkills.length)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}
```

---

## Hooks v2 Optimisés

### useStudentGroups

```javascript
import { useStudentGroups } from '@/hooks/use18Relations.enhanced'

export function MyGroupsComponent() {
  const { 
    groups,        // Array of groups
    loading,       // Boolean
    error,         // Error object or null
    createGroup,   // Function
    addStudent,    // Function
    getGroupById   // Function
  } = useStudentGroups('course-id')

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div>
      <h2>Mes Groupes ({groups.length})</h2>
      {groups.map(group => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}
```

**Features:**
- ✅ Auto-refresh avec interval configurable
- ✅ Cache results for 5 minutes
- ✅ Memoized callbacks (useCallback)
- ✅ Error recovery with retry

### useStudentAlerts

```javascript
import { useStudentAlerts } from '@/hooks/use18Relations.enhanced'

export function AlertsWidget() {
  const {
    alerts,         // All alerts
    unresolved,     // Unresolved only
    loading,        // Boolean
    error,          // Error or null
    resolveAlert,   // Function
    filterAlerts    // Function
  } = useStudentAlerts('student-id')

  const criticalAlerts = filterAlerts({ severity: 'critical' })

  return (
    <div>
      <h3>⚠️ Alertes critiques: {criticalAlerts.length}</h3>
      {criticalAlerts.map(alert => (
        <div key={alert.id} className="alert">
          <p>{alert.message}</p>
          <button onClick={() => resolveAlert(alert.id)}>
            Marquer comme résolu
          </button>
        </div>
      ))}
    </div>
  )
}
```

**Features:**
- ✅ Automatic filtering of unresolved
- ✅ Severity-based highlighting
- ✅ Real-time alert resolution
- ✅ Polling for new alerts

### useInternshipPipeline

```javascript
import { useInternshipPipeline } from '@/hooks/use18Relations.enhanced'

export function InternshipDashboard() {
  const {
    offers,             // Available offers
    applications,       // Student applications
    applyForInternship, // Function
    loading,            // Boolean
    error               // Error or null
  } = useInternshipPipeline('student-id')

  const handleApply = async (offerId) => {
    try {
      await applyForInternship(offerId)
      alert('Candidature envoyée!')
    } catch (err) {
      alert('Erreur: ' + err.message)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {offers.map(offer => (
        <OfferCard
          key={offer.id}
          offer={offer}
          onApply={() => handleApply(offer.id)}
        />
      ))}
    </div>
  )
}
```

**Features:**
- ✅ Separate active/archived offers
- ✅ Track application status
- ✅ Resume data validation
- ✅ Email notifications

### useCompetencies (with Caching!)

```javascript
import { useCompetencies } from '@/hooks/use18Relations.enhanced'

export function CompetenciesBoard() {
  const {
    competencies,    // All competencies
    getByCategory,   // Function
    addCompetency,   // Function
    loading,         // Boolean
    isCached         // Is using cache?
  } = useCompetencies('category-filter')

  // Competencies cached for 5 minutes
  const programmingSkills = getByCategory('programming')
  const softSkills = getByCategory('soft-skills')

  return (
    <div>
      <h2>Compétences {isCached && '(en cache)'}</h2>
      <Section title="Programmation">
        {programmingSkills.map(c => <Skill key={c.id} skill={c} />)}
      </Section>
      <Section title="Compétences Douces">
        {softSkills.map(c => <Skill key={c.id} skill={c} />)}
      </Section>
    </div>
  )
}
```

**Features:**
- ✅ Aggressive caching (TTL: 5 min)
- ✅ Category filtering built-in
- ✅ Verification status tracking
- ✅ Endorsement system ready

### useProfessorDashboard

```javascript
import { useProfessorDashboard } from '@/hooks/use18Relations.enhanced'

export function ProfessorStats() {
  const {
    settings,        // Dashboard settings
    stats,           // Class statistics
    getClassStats,   // Function
    updateSettings,  // Function
    loading
  } = useProfessorDashboard('professor-id')

  const classStats = getClassStats('class-id')

  return (
    <div className="dashboard">
      <div className="stat-card">
        <h3>Présence: {classStats?.attendance}%</h3>
      </div>
      <div className="stat-card">
        <h3>Moyenne: {classStats?.average}/20</h3>
      </div>
    </div>
  )
}
```

---

## Gestion d'Erreurs

### Erreurs Anticipées & Récupération

```javascript
import { getSupabaseClient, formatSupabaseError } from '@/config/supabase.config'

async function handleErrors() {
  try {
    const result = await StudentGroupsService.createGroup(groupData)
  } catch (error) {
    // formatSupabaseError convertit l'erreur Supabase en message user-friendly
    const userMessage = formatSupabaseError(error)
    console.error('Message utilisateur:', userMessage)
    
    // Exemple de sortie:
    // "Le groupe existe déjà pour ce cours"
    // au lieu de: "Unique constraint violation on (course_id, name)"
  }
}
```

### Types d'Erreurs Gérées

```javascript
// ✅ UUID invalide -> "Invalid student ID format"
// ✅ Champ requis manquant -> "name is required"
// ✅ Contrainte unique -> "This group already exists for this course"
// ✅ Unauthorized -> "You don't have permission to access this"
// ✅ Network error -> "Connection failed. Please try again."
// ✅ Rate limited -> "Too many requests. Please wait a moment."
```

---

## Exemples de Code

### Exemple 1: Module Complet de Gestion des Groupes

```javascript
import React, { useState } from 'react'
import { useStudentGroups } from '@/hooks/use18Relations.enhanced'

export function GroupManagement({ professorId }) {
  const { groups, loading, error, createGroup } = useStudentGroups(professorId)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')

  const handleCreate = async () => {
    try {
      await createGroup({
        name,
        professor_id: professorId,
        max_students: 30
      })
      setName('')
      setShowForm(false)
    } catch (error) {
      alert('Erreur: ' + error.message)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="container">
      <h1>Gérer les Groupes</h1>
      
      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); handleCreate() }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du groupe"
          />
          <button type="submit">Créer</button>
        </form>
      )}

      <button onClick={() => setShowForm(!showForm)}>
        + Nouveau Groupe
      </button>

      <div className="groups-list">
        {groups.map(group => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  )
}
```

### Exemple 2: Tableau Alertes Temps Réel

```javascript
import { useStudentAlerts } from '@/hooks/use18Relations.enhanced'

export function AlertsDashboard({ studentId }) {
  const { alerts, unresolved, resolveAlert, filterAlerts } = useStudentAlerts(studentId)

  const criticalAlerts = filterAlerts({ severity: 'critical' })
  const highAlerts = filterAlerts({ severity: 'high' })

  return (
    <div className="alerts-dashboard">
      <section className="critical-alerts">
        <h2>🚨 Critiques ({criticalAlerts.length})</h2>
        {criticalAlerts.map(alert => (
          <AlertBanner
            key={alert.id}
            alert={alert}
            onResolve={() => resolveAlert(alert.id)}
            severity="critical"
          />
        ))}
      </section>

      <section className="high-alerts">
        <h2>⚠️ Importantes ({highAlerts.length})</h2>
        {highAlerts.map(alert => (
          <AlertBanner
            key={alert.id}
            alert={alert}
            onResolve={() => resolveAlert(alert.id)}
            severity="high"
          />
        ))}
      </section>
    </div>
  )
}
```

---

## FAQ & Troubleshooting

### Q: Comment savoir si un hook utilise le cache?
```javascript
const { isCached } = useCompetencies()
console.log(isCached ? '📦 Données en cache' : '🔄 Nouveaux chargement')
```

### Q: Comment forcer un nouveau chargement?
```javascript
const { refetch } = useStudentGroups()
// Ajouter un bouton "Actualiser"
<button onClick={refetch}>Actualiser</button>
```

### Q: Les erreurs Supabase sont-elles formatées?
```javascript
Oui! formatSupabaseError() convertit automatiquement:
❌ Erreur technique: "23505: duplicate key value violates unique constraint"
✅ Message utilisateur: "Ce groupe existe déjà"
```

### Q: Quelle est la limite de rate limiting?
```
Supabase: 2000 req/seconde par projet
18Relations: Quelques secondes per user avant throttling
Recommandation: Implémenter debounce sur les recherches
```

### Q: Comment déboguer les problèmes de connexion?
```javascript
import { testConnection } from '@/config/supabase.config'

testConnection().then(ok => {
  console.log('✅ Supabase OK' if ok else '❌ Connection failed')
})
```

### Q: Les types TypeScript sont supportés?
```javascript
Oui! Voir: src/types/18Relations.types.d.ts
```

---

## 📞 Démarrage Rapide (5 min)

1. **Importer le service:**
   ```javascript
   import { StudentGroupsService } from '@/services/18Relations.index'
   ```

2. **Utiliser ou Hook:**
   ```javascript
   const { groups } = useStudentGroups(courseId)
   ```

3. **Réagir aux données:**
   ```javascript
   {groups.map(g => <Group key={g.id} data={g} />)}
   ```

4. **Gérer les erreurs:**
   ```javascript
   if (error) return <ErrorMessage msg={error} />
   ```

5. **Tester en production:**
   ```bash
   npm run build && npm test
   ```

---

✅ **Prêt à utiliser!** Tous les services fonctionnent avec Supabase et sont pleinement testés.

