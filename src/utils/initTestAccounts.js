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
 * Initialise les comptes de test dans Supabase avec un délai entre chaque compte
 * @returns {Promise<Object>} Résultat de l'initialisation
 */
export const initializeTestAccounts = async () => {
  const results = {
    success: [],
    errors: []
  };

  console.log("Début de l'initialisation des comptes de test...");

  // Fonction pour attendre un certain temps
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Créer chaque compte de test avec un délai entre chaque
  const accounts = Object.entries(TEST_ACCOUNTS);
  
  for (let i = 0; i < accounts.length; i++) {
    const [role, account] = accounts[i];
    
    try {
      console.log(`Initialisation du compte ${role}...`);
      
      // Vérifier si l'utilisateur existe déjà par email dans auth
      console.log(`Vérification de l'existence du compte ${role}...`);
      
      // Créer l'utilisateur dans auth
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
        // Ignorer l'erreur si l'utilisateur existe déjà
        if (signUpError.message.includes('User already registered')) {
          console.log(`Le compte ${role} existe déjà.`);
          results.success.push(`${role} (déjà existant)`);
        } else {
          throw signUpError;
        }
      } else {
        console.log(`Compte ${role} créé avec succès.`);
        results.success.push(role);
      }
      
      // Attendre 3 secondes entre chaque création de compte pour éviter les limitations de taux
      if (i < accounts.length - 1) {
        console.log("Attente de 3 secondes avant la prochaine initialisation...");
        await delay(3000);
      }
      
    } catch (error) {
      console.error(`Erreur lors de la création du compte ${role}:`, error);
      results.errors.push({role, error: error.message});
    }
  }
  
  return results;
};

export default initializeTestAccounts;
