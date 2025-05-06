/**
 * Script d'initialisation des comptes de test
 * Ce script permet de créer des comptes de test pour l'application
 */

import { supabase } from '../supabase';
import { createTestAccounts, TEST_ACCOUNTS } from './testAccounts';

/**
 * Initialise les comptes de test dans Supabase
 * Cette fonction doit être appelée manuellement en développement
 */
export const initializeTestAccounts = async () => {
  console.log('Initialisation des comptes de test...');
  
  try {
    const results = await createTestAccounts(supabase);
    
    console.log('Résultats de l\'initialisation:');
    console.log('- Comptes créés avec succès:', results.success.join(', ') || 'Aucun');
    
    if (results.errors.length > 0) {
      console.log('- Erreurs:', results.errors.map(e => `${e.role}: ${e.error}`).join(', '));
    }
    
    return results;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des comptes de test:', error);
    return { success: [], errors: [{ role: 'global', error: error.message }] };
  }
};

/**
 * Récupère les informations des comptes de test
 * @returns {Object} Informations des comptes de test
 */
export const getTestAccountsInfo = () => {
  return Object.entries(TEST_ACCOUNTS).map(([role, account]) => ({
    role,
    email: account.email,
    password: account.password,
    fullName: `${account.profile.first_name} ${account.profile.last_name}`
  }));
};

export default {
  initializeTestAccounts,
  getTestAccountsInfo
};
