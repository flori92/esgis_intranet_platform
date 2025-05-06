/**
 * Comptes de test pour l'application
 * Ce fichier contient les informations des comptes de test pour les différents rôles
 * À utiliser uniquement en développement
 */

// Comptes de test pour chaque rôle
export const TEST_ACCOUNTS = {
  // Compte administrateur
  admin: {
    email: 'admin.esgis@mailinator.com',
    password: 'Admin123!',
    profile: {
      first_name: 'Admin',
      last_name: 'ESGIS',
      role: 'admin',
      phone: '+22990123456',
      department: 'Administration',
      avatar_url: null
    }
  },
  
  // Compte professeur
  professor: {
    email: 'prof.esgis@mailinator.com',
    password: 'Prof123!',
    profile: {
      first_name: 'Floraice',
      last_name: 'FAVI',
      role: 'professor',
      phone: '+22991234567',
      department: 'Informatique',
      speciality: 'Cloud Computing',
      avatar_url: null
    }
  },
  
  // Compte étudiant
  student: {
    email: 'etudiant.esgis@mailinator.com',
    password: 'Etudiant123!',
    profile: {
      first_name: 'Marie',
      last_name: 'Koné',
      role: 'student',
      phone: '+22992345678',
      department: 'Informatique',
      student_id: 'INF2025001',
      level: 'Licence 3',
      avatar_url: null
    }
  }
};

/**
 * Crée les comptes de test dans Supabase
 * @param {Object} supabase - Instance Supabase
 * @returns {Promise<Object>} Résultat de la création des comptes
 */
export const createTestAccounts = async (supabase) => {
  const results = {
    success: [],
    errors: []
  };

  // Créer chaque compte de test
  for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', account.email)
        .maybeSingle();

      if (existingUser) {
        console.log(`Le compte ${role} existe déjà.`);
        results.success.push(`${role} (déjà existant)`);
        continue;
      }

      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            role: account.profile.role
          }
        }
      });

      if (authError) {
        throw authError;
      }

      const userId = authData.user.id;

      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId, 
          email: account.email,
          ...account.profile 
        }]);

      if (profileError) {
        throw profileError;
      }

      console.log(`Compte ${role} créé avec succès.`);
      results.success.push(role);
    } catch (error) {
      console.error(`Erreur lors de la création du compte ${role}:`, error);
      results.errors.push({ role, error: error.message });
    }
  }

  return results;
};

export default {
  TEST_ACCOUNTS,
  createTestAccounts
};
