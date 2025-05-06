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

  console.log("Début de l'initialisation des comptes de test...");

  // Créer chaque compte de test
  for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
    try {
      // Vérifier si l'utilisateur existe déjà par email dans auth
      console.log(`Vérification de l'existence du compte ${role}...`);
      
      // Tentative de connexion pour vérifier si le compte existe
      const { data: authData, error: signInError } = await supabase.auth
        .signInWithPassword({
          email: account.email,
          password: account.password,
        });
      
      if (!signInError && authData && authData.user) {
        console.log(`Le compte ${role} existe déjà.`);
        results.success.push(`${role} (déjà existant)`);
        continue;
      }
      
      // Créer l'utilisateur dans auth
      console.log(`Création du compte ${role}...`);
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            role: account.profile.role,
            first_name: account.profile.first_name,
            last_name: account.profile.last_name
          }
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      console.log(`Compte ${role} créé avec succès.`);
      results.success.push(role);
      
    } catch (error) {
      console.error(`Erreur lors de la création du compte ${role}:`, error);
      results.errors.push({role, error: error.message});
    }
  }
  
  return results;
};

export default initializeTestAccounts;
