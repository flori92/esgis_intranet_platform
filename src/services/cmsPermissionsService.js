import { supabase } from '@/supabase';

/**
 * Service pour gérer les permissions CMS
 */
export const cmsPermissionsService = {
  /**
   * Vérifier si un utilisateur a une permission CMS
   */
  async hasPermission(userId, permissionType, targetModule = 'all') {
    const { data, error } = await supabase.rpc('has_cms_permission', {
      p_user_id: userId,
      p_permission_type: permissionType,
      p_target_module: targetModule
    });

    if (error) throw error;
    return data || false;
  },

  /**
   * Donner une permission à un utilisateur
   */
  async grantPermission(userId, permissionType, targetModule = 'all') {
    const { data: currentUser } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('cms_permissions')
      .insert([
        {
          user_id: userId,
          permission_type: permissionType,
          target_module: targetModule,
          granted_by: currentUser.user?.id
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Retirer une permission à un utilisateur
   */
  async revokePermission(userId, targetModule = 'all') {
    const { error } = await supabase
      .from('cms_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('target_module', targetModule);

    if (error) throw error;
  },

  /**
   * Récupérer les permissions d'un utilisateur
   */
  async getUserPermissions(userId) {
    const { data, error } = await supabase
      .from('cms_permissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer tous les utilisateurs avec accès CMS
   */
  async getAllCmsUsers() {
    const { data, error } = await supabase
      .from('cms_permissions')
      .select(`
        user_id,
        permission_type,
        target_module,
        granted_by,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Grouper par utilisateur
    const grouped = {};
    (data || []).forEach((perm) => {
      if (!grouped[perm.user_id]) {
        grouped[perm.user_id] = {
          user_id: perm.user_id,
          permissions: []
        };
      }
      grouped[perm.user_id].permissions.push({
        type: perm.permission_type,
        module: perm.target_module,
        grantedBy: perm.granted_by,
        createdAt: perm.created_at
      });
    });

    return Object.values(grouped);
  },

  /**
   * Récupérer les modules auxquels un utilisateur a accès
   */
  async getUserModules(userId) {
    const { data, error } = await supabase.rpc('get_user_cms_modules', {
      p_user_id: userId
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Logger une action CMS
   */
  async logAction(userId, action, tableName, recordId = null, recordTitle = null, changes = null) {
    const { error } = await supabase.rpc('log_cms_action', {
      p_user_id: userId,
      p_action: action,
      p_table_name: tableName,
      p_record_id: recordId,
      p_record_title: recordTitle,
      p_changes: changes
    });

    if (error) {
      console.error('Erreur logging action CMS:', error);
      // Ne pas lever l'erreur - le logging ne doit pas bloquer l'opération
    }
  },

  /**
   * Récupérer les logs CMS
   */
  async getAccessLogs(filters = {}) {
    let query = supabase
      .from('cms_access_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.tableName) {
      query = query.eq('table_name', filters.tableName);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
};

/**
 * Hook pour vérifier les permissions CMS
 */
export function useCMSPermission(userId) {
  const [permissions, setPermissions] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        const perms = await cmsPermissionsService.getUserPermissions(userId);
        setPermissions(perms);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [userId]);

  return { permissions, loading, error };
}
