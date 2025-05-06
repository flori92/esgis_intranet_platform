import { supabase } from '../supabase';
import { TEST_ACCOUNTS } from './testAccounts';

/**
 * Récupère les informations des comptes de test
 * @returns {Array} Informations des comptes de test
 */
export const getTestAccountsInfo = () => {
  return Object.entries(TEST_ACCOUNTS).map(([role, account]) => ({
    role,
    email: account.email,
    password: account.password,
    fullName: `${account.profile.first_name} ${account.profile.last_name}`
  }));
};

/**
 * Initialise les comptes de test dans Supabase
 * @returns {Promise<Object>} Résultat de l'initialisation
 */
export const initializeTestAccounts = async () => {
  const results = {
    success: [],
    errors: []
  };

  // Créer chaque compte de test
  for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
    try {
      // Vérifier si l'utilisateur existe déjà par email dans auth
      const { data: authUsers, error: authError } = await supabase.auth
        .signInWithPassword({
          email: account.email,
          password: account.password,
        });
      
      if (!authError && authUsers) {
        console.log(`Le compte ${role} existe déjà dans auth.`);
        results.success.push(`${role} (déjà existant)`);
        continue;
      }
      
      // Créer l'utilisateur dans auth
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            role: account.profile.role
          }
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      console.log(`Compte ${role} créé avec succès dans auth.`);
      results.success.push(role);
      
      // Note: Nous ne créons plus manuellement le profil car Supabase
      // le fait automatiquement via des triggers ou des webhooks.
      // Cela évite les problèmes de politiques de sécurité récursives.
      
    } catch (error) {
      console.error(`Erreur lors de la création du compte ${role}:`, error);
      results.errors.push({role, error: error.message});
    }
  }
  
  return results;
};

export default initializeTestAccounts;
