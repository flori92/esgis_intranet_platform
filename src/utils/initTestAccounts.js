import { signInWithEmail, signOut as apiSignOut, signUpWithEmail } from '../api/auth';
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
  const accountExists = async (account) => {
    const { user, error } = await signInWithEmail(account.email, account.password);

    if (user) {
      await apiSignOut();
      return true;
    }

    if (!error) {
      return false;
    }

    const errorMessage = error.message || '';

    if (errorMessage.includes('Email not confirmed')) {
      return true;
    }

    if (errorMessage.includes('Invalid login credentials')) {
      return false;
    }

    throw error;
  };

  // Créer chaque compte de test avec un délai entre chaque
  const accounts = Object.entries(TEST_ACCOUNTS);
  
  for (let i = 0; i < accounts.length; i++) {
    const [role, account] = accounts[i];
    
    try {
      console.log(`Initialisation du compte ${role}...`);
      
      // Vérifier si l'utilisateur existe déjà par email dans auth
      console.log(`Vérification de l'existence du compte ${role}...`);

      if (await accountExists(account)) {
        console.log(`Le compte ${role} existe déjà.`);
        results.success.push(`${role} (déjà existant)`);
        continue;
      }
      
      // Créer l'utilisateur dans auth
      const { user: newUser, error: signUpError } = await signUpWithEmail(
        account.email,
        account.password,
        {
          role: account.profile.role,
          full_name: `${account.profile.first_name} ${account.profile.last_name}`.trim()
        }
      );
      
      if (signUpError) {
        // Ignorer l'erreur si l'utilisateur existe déjà
        if (
          signUpError.message.includes('User already registered') ||
          signUpError.message.includes('already been registered')
        ) {
          console.log(`Le compte ${role} existe déjà.`);
          results.success.push(`${role} (déjà existant)`);
        } else if (
          signUpError.message.includes('email rate limit exceeded') ||
          signUpError.message.includes('For security purposes')
        ) {
          console.warn(`Limite de création atteinte pour le compte ${role}.`);
          results.errors.push({
            role,
            error: "Limite d'envoi d'emails atteinte. Reessayez plus tard ou desactivez la confirmation email en developpement."
          });
        } else {
          throw signUpError;
        }
      } else {
        console.log(`Compte ${role} créé avec succès.`);
        results.success.push(role);
      }
      
      // Attendre 3 secondes entre chaque création de compte pour éviter les limitations de taux
      if (newUser && i < accounts.length - 1) {
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
