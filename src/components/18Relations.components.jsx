// ==========================================
// COMPOSANTS REACT: Les 3 Relations Prioritaires
// Student Groups, Alerts, Internship Pipeline
// ==========================================

import React, { useState } from 'react'
import {
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline
} from '@/hooks/use18Relations.enhanced'

// ==========================================
// 1. STUDENT GROUPS MANAGER
// ==========================================
export function StudentGroupsManager({ courseId, professorId }) {
  const { groups, loading, error, createGroup, addStudent } = useStudentGroups(courseId)
  const [newGroupName, setNewGroupName] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      await createGroup({
        name: newGroupName,
        course_id: courseId,
        professor_id: professorId,
        max_students: 30
      })
      setNewGroupName('')
      setShowForm(false)
    } catch (err) {
      console.error('Failed to create group:', err)
    }
  }

  if (loading) return <div className="spinner">Chargement groupes...</div>
  if (error) return <div className="error">Erreur: {error}</div>

  return (
    <div className="groups-manager p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Groupes TP/TD</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Nouveau Groupe
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded mb-6 border border-gray-200">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nom du groupe (ex: TP Maths A)"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateGroup}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Créer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} onAddStudent={addStudent} />
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Aucun groupe créé. Commencez par créer votre premier groupe!
        </div>
      )}
    </div>
  )
}

function GroupCard({ group, onAddStudent }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="font-bold text-lg mb-2">{group.name}</h3>
      <div className="text-sm text-gray-600 mb-3">
        <p>📍 {group.room || 'Room TBD'}</p>
        <p>👥 Capacité: {group.max_students}</p>
      </div>
    </div>
  )
}

// ==========================================
// 2. STUDENT ALERTS PANEL
// ==========================================
export function StudentAlertsPanel({ studentId }) {
  const { alerts, unresolved, loading, error, resolveAlert } = useStudentAlerts(studentId)

  if (loading) return <div className="spinner">Chargement alertes...</div>
  if (error) return <div className="error">Erreur: {error}</div>

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-l-4 border-red-500'
      case 'high':
        return 'bg-orange-100 border-l-4 border-orange-500'
      case 'medium':
        return 'bg-yellow-100 border-l-4 border-yellow-500'
      default:
        return 'bg-blue-100 border-l-4 border-blue-500'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'medium':
        return '⚡'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="alerts-panel">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Alertes</h2>
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            {unresolved.length} non résolue{unresolved.length > 1 ? 's' : ''}
          </span>
        </div>

        {unresolved.length === 0 ? (
          <div className="text-center text-green-600 py-8">
            ✅ Aucune alerte - Tout va bien!
          </div>
        ) : (
          <div className="space-y-3">
            {unresolved.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                severityColor={getSeverityColor(alert.severity)}
                icon={getSeverityIcon(alert.severity)}
                onResolve={resolveAlert}
              />
            ))}
          </div>
        )}

        {alerts.length > unresolved.length && (
          <div className="mt-6 pt-6 border-t">
            <details className="cursor-pointer">
              <summary className="text-gray-600 hover:text-gray-900">
                📋 Voir les alertes résolues ({alerts.length - unresolved.length})
              </summary>
              <div className="mt-3 space-y-2">
                {alerts
                  .filter((a) => a.is_resolved)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-gray-50 p-3 rounded text-sm text-gray-600 line-through"
                    >
                      {alert.message}
                    </div>
                  ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

function AlertCard({ alert, severityColor, icon, onResolve }) {
  const handleResolve = async () => {
    try {
      await onResolve(alert.id)
    } catch (err) {
      console.error('Failed to resolve alert:', err)
    }
  }

  return (
    <div className={`p-4 rounded ${severityColor}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <span className="font-bold uppercase text-sm">{alert.alert_type}</span>
          </div>
          <p className="mt-2 text-gray-800">{alert.message}</p>
          <p className="text-xs text-gray-600 mt-2">
            {new Date(alert.triggered_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <button
          onClick={handleResolve}
          className="ml-4 bg-white text-green-600 px-3 py-1 rounded hover:bg-green-50 text-sm font-medium"
        >
          ✓ Acquitter
        </button>
      </div>
    </div>
  )
}

// ==========================================
// 3. INTERNSHIP BOARD
// ==========================================
export function InternshipBoard({ studentId }) {
  const { offers, applications, applyForInternship, loading, error } =
    useInternshipPipeline(studentId)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [motivation, setMotivation] = useState('')

  const handleApply = async () => {
    if (!motivation.trim()) return
    try {
      await applyForInternship(selectedOffer.id, {
        motivation_letter: motivation
      })
      setMotivation('')
      setShowForm(false)
      setSelectedOffer(null)
    } catch (err) {
      console.error('Failed to apply:', err)
    }
  }

  if (loading) return <div className="spinner">Chargement offres...</div>
  if (error) return <div className="error">Erreur: {error}</div>

  return (
    <div className="internship-board">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Offers */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">🌟 Offres de Stage</h2>

            {offers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Aucune offre disponible actuellement
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isSelected={selectedOffer?.id === offer.id}
                    onSelect={() => {
                      setSelectedOffer(offer)
                      setShowForm(true)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Application Form or My Applications */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            {showForm && selectedOffer ? (
              <div>
                <h3 className="font-bold mb-4">Postuler pour</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedOffer.title}</p>

                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Expliquez pourquoi vous êtes intéressé..."
                  className="w-full p-3 border border-gray-300 rounded mb-4 h-32"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleApply}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-bold"
                  >
                    Candidater
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setMotivation('')
                    }}
                    className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold mb-4">📝 Mes Candidatures</h3>
                {applications.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune candidature encore</p>
                ) : (
                  <div className="space-y-2">
                    {applications.map((app) => (
                      <div key={app.id} className="bg-blue-50 p-3 rounded text-sm">
                        <p className="font-medium">{app.internship_offers?.title}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Statut: <span className="font-bold">{app.status}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(app.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OfferCard({ offer, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 border rounded-lg cursor-pointer transition ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <h3 className="font-bold text-lg">{offer.title}</h3>
      <p className="text-sm text-gray-600 mt-1">{offer.companies?.name}</p>
      <div className="mt-3 flex gap-2 flex-wrap">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
          📍 {offer.location}
        </span>
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
          💼 {offer.duration_months || '?'} mois
        </span>
      </div>
      <p className="text-sm text-gray-700 mt-3 line-clamp-2">{offer.description}</p>
    </div>
  )
}

export default {
  StudentGroupsManager,
  StudentAlertsPanel,
  InternshipBoard
}
