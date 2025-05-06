import { supabase } from '@/supabase';
import { GROUP_MEMBER_STATUS } from '@/types/groups';

/**
 * Service pour la gestion des groupes de TP
 */
class GroupService {
  /**
   * Récupérer tous les groupes créés par un professeur
   * @param {string} professorId - ID du professeur
   * @returns {Promise<Array>} Liste des groupes
   */
  async getProfessorGroups(professorId) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*, courses(*)')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes du professeur:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les groupes auxquels un étudiant est inscrit
   * @param {string} studentId - ID de l'étudiant
   * @returns {Promise<Array>} Liste des groupes
   */
  async getStudentGroups(studentId) {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, groups(*), groups.courses(*)')
        .eq('user_id', studentId)
        .eq('status', GROUP_MEMBER_STATUS.ACCEPTED)
        .order('joined_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(item => ({
        ...item.groups,
        joined_at: item.joined_at
      })) || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes de l\'étudiant:', error);
      throw error;
    }
  }

  /**
   * Récupérer les groupes disponibles pour un étudiant
   * @param {string} studentId - ID de l'étudiant
   * @returns {Promise<Array>} Liste des groupes disponibles
   */
  async getAvailableGroups(studentId) {
    try {
      // Récupérer d'abord les IDs des groupes auxquels l'étudiant est déjà inscrit
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', studentId);

      if (memberError) {
        throw memberError;
      }

      const joinedGroupIds = memberData.map(item => item.group_id);

      // Récupérer les groupes actifs auxquels l'étudiant n'est pas inscrit
      let query = supabase
        .from('groups')
        .select('*, courses(*), profiles!groups_professor_id_fkey(*)')
        .eq('is_active', true);

      if (joinedGroupIds.length > 0) {
        query = query.not('id', 'in', `(${joinedGroupIds.join(',')})`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes disponibles:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau groupe
   * @param {Object} group - Données du groupe
   * @returns {Promise<Object>} Groupe créé
   */
  async createGroup(group) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([group])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un groupe
   * @param {string} groupId - ID du groupe
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} Groupe mis à jour
   */
  async updateGroup(groupId, updates) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du groupe:', error);
      throw error;
    }
  }

  /**
   * Supprimer un groupe
   * @param {string} groupId - ID du groupe
   * @returns {Promise<void>}
   */
  async deleteGroup(groupId) {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error);
      throw error;
    }
  }

  /**
   * Récupérer les membres d'un groupe
   * @param {string} groupId - ID du groupe
   * @returns {Promise<Array>} Liste des membres
   */
  async getGroupMembers(groupId) {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, profiles(*)')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des membres du groupe:', error);
      throw error;
    }
  }

  /**
   * Ajouter un étudiant à un groupe
   * @param {string} groupId - ID du groupe
   * @param {string} studentId - ID de l'étudiant
   * @param {string} status - Statut de l'adhésion
   * @returns {Promise<Object>} Adhésion créée
   */
  async addGroupMember(groupId, studentId, status = GROUP_MEMBER_STATUS.ACCEPTED) {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: studentId,
          status,
          joined_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre au groupe:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'un membre
   * @param {string} groupId - ID du groupe
   * @param {string} studentId - ID de l'étudiant
   * @param {string} status - Nouveau statut
   * @returns {Promise<Object>} Adhésion mise à jour
   */
  async updateMemberStatus(groupId, studentId, status) {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .update({ status })
        .eq('group_id', groupId)
        .eq('user_id', studentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du membre:', error);
      throw error;
    }
  }

  /**
   * Supprimer un membre d'un groupe
   * @param {string} groupId - ID du groupe
   * @param {string} studentId - ID de l'étudiant
   * @returns {Promise<void>}
   */
  async removeGroupMember(groupId, studentId) {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', studentId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du membre du groupe:', error);
      throw error;
    }
  }

  /**
   * Demander à rejoindre un groupe
   * @param {string} groupId - ID du groupe
   * @param {string} studentId - ID de l'étudiant
   * @returns {Promise<Object>} Demande créée
   */
  async requestToJoinGroup(groupId, studentId) {
    return this.addGroupMember(groupId, studentId, GROUP_MEMBER_STATUS.PENDING);
  }

  /**
   * Accepter une demande d'adhésion
   * @param {string} groupId - ID du groupe
   * @param {string} studentId - ID de l'étudiant
   * @returns {Promise<Object>} Adhésion mise à jour
   */
  async acceptJoinRequest(groupId, studentId) {
    return this.updateMemberStatus(groupId, studentId, GROUP_MEMBER_STATUS.ACCEPTED);
  }

  /**
   * Rejeter une demande d'adhésion
   * @param {string} groupId - ID du groupe
   * @param {string} studentId - ID de l'étudiant
   * @returns {Promise<Object>} Adhésion mise à jour
   */
  async rejectJoinRequest(groupId, studentId) {
    return this.updateMemberStatus(groupId, studentId, GROUP_MEMBER_STATUS.REJECTED);
  }
}

export default new GroupService();
