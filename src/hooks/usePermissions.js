/**
 * Hook de vérification des permissions RBAC
 * Vérifie les permissions de l'utilisateur connecté via ses rôles custom
 * ou via son rôle système (admin, professor, student).
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

/**
 * Permissions par défaut pour les rôles système
 */
const SYSTEM_PERMISSIONS = {
  super_admin: null, // null = accès total
  admin: {
    students: ['create', 'read', 'update', 'delete', 'import', 'export'],
    professors: ['create', 'read', 'update', 'delete'],
    courses: ['create', 'read', 'update', 'delete', 'assign'],
    grades: ['read', 'update', 'publish'],
    exams: ['read'],
    documents: ['create', 'read', 'update', 'delete', 'generate', 'validate'],
    schedule: ['create', 'read', 'update', 'delete'],
    messages: ['create', 'read', 'delete'],
    stages: ['create', 'read', 'update', 'delete'],
    payments: ['create', 'read', 'update', 'validate'],
    reports: ['read', 'export'],
    system: ['read', 'update'],
    audit: ['read'],
  },
  professor: {
    students: ['read'],
    courses: ['read'],
    grades: ['create', 'read', 'update', 'publish'],
    exams: ['create', 'read', 'update', 'delete', 'grade'],
    documents: ['create', 'read'],
    schedule: ['read'],
    messages: ['create', 'read'],
  },
  student: {
    courses: ['read'],
    grades: ['read'],
    exams: ['read'],
    documents: ['read'],
    schedule: ['read'],
    messages: ['create', 'read'],
    stages: ['read'],
    payments: ['read'],
  },
};

/**
 * Hook pour gérer les permissions de l'utilisateur
 * @returns {Object} Fonctions de vérification des permissions
 */
export const usePermissions = () => {
  const { authState } = useAuth();
  const [customPermissions, setCustomPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les rôles custom de l'utilisateur
  useEffect(() => {
    const fetchCustomRoles = async () => {
      if (!authState.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role_id, custom_roles(permissions)')
          .eq('user_id', authState.user.id);

        if (error) {
          console.error('Erreur chargement rôles custom:', error);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Fusionner les permissions de tous les rôles assignés
          const merged = {};
          data.forEach((ur) => {
            const perms = ur.custom_roles?.permissions || {};
            Object.entries(perms).forEach(([resource, actions]) => {
              if (!merged[resource]) {
                merged[resource] = [];
              }
              actions.forEach((action) => {
                if (!merged[resource].includes(action)) {
                  merged[resource].push(action);
                }
              });
            });
          });
          setCustomPermissions(merged);
        }
      } catch (err) {
        console.error('Exception chargement permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomRoles();
  }, [authState.user?.id]);

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * @param {string} resource - Ressource (students, courses, etc.)
   * @param {string} action - Action (create, read, update, delete, etc.)
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (resource, action) => {
      if (!authState.user) return false;

      const role = authState.profile?.role || authState.user.role;

      // Super admin = accès total
      if (role === 'super_admin' || authState.isSuperAdmin) return true;

      // Vérifier d'abord les permissions custom (plus granulaires)
      if (customPermissions) {
        const resourcePerms = customPermissions[resource] || [];
        if (resourcePerms.includes(action)) return true;
      }

      // Sinon, vérifier les permissions système par défaut
      const systemPerms = SYSTEM_PERMISSIONS[role];
      if (!systemPerms) return false; // rôle inconnu

      const resourcePerms = systemPerms[resource] || [];
      return resourcePerms.includes(action);
    },
    [authState.user, authState.profile, authState.isSuperAdmin, customPermissions]
  );

  /**
   * Vérifie si l'utilisateur a accès à une ressource (au moins une action)
   * @param {string} resource
   * @returns {boolean}
   */
  const canAccess = useCallback(
    (resource) => {
      if (!authState.user) return false;
      const role = authState.profile?.role || authState.user.role;
      if (role === 'super_admin' || authState.isSuperAdmin) return true;

      if (customPermissions?.[resource]?.length > 0) return true;

      const systemPerms = SYSTEM_PERMISSIONS[role];
      if (!systemPerms) return false;
      return (systemPerms[resource] || []).length > 0;
    },
    [authState.user, authState.profile, authState.isSuperAdmin, customPermissions]
  );

  /**
   * Récupère toutes les permissions effectives de l'utilisateur
   * @returns {Object} Permissions fusionnées
   */
  const getEffectivePermissions = useCallback(() => {
    const role = authState.profile?.role || authState.user?.role;
    if (role === 'super_admin' || authState.isSuperAdmin) return null; // null = tout

    const systemPerms = SYSTEM_PERMISSIONS[role] || {};
    if (!customPermissions) return { ...systemPerms };

    // Fusionner système + custom
    const merged = { ...systemPerms };
    Object.entries(customPermissions).forEach(([resource, actions]) => {
      if (!merged[resource]) {
        merged[resource] = [];
      }
      actions.forEach((action) => {
        if (!merged[resource].includes(action)) {
          merged[resource].push(action);
        }
      });
    });

    return merged;
  }, [authState.profile, authState.user, authState.isSuperAdmin, customPermissions]);

  return {
    hasPermission,
    canAccess,
    getEffectivePermissions,
    loading,
    isSuperAdmin: authState.isSuperAdmin,
  };
};
